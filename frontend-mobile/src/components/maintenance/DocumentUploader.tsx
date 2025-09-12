import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, ProgressBar, Text } from 'react-native-paper';

import { AppColors } from '../../styles/colors';

export interface DocumentFile {
    id: string;
    uri: string;
    name: string;
    type: 'image' | 'pdf';
    category: 'nota_fiscal' | 'orcamento' | 'garantia' | 'outros';
    size?: number;
    mimeType?: string;
    isUploading?: boolean;
    uploadedUrl?: string; // URL retornada pelo servidor após upload
}

interface DocumentUploaderProps {
    documents: DocumentFile[];
    onDocumentsChange: (documents: DocumentFile[]) => void;
    maxDocuments?: number;
}

const DOCUMENT_CATEGORIES = [
    { key: 'nota_fiscal', label: 'Nota Fiscal', icon: 'receipt', required: true },
    { key: 'orcamento', label: 'Orçamento', icon: 'file-document-outline', required: false },
    { key: 'garantia', label: 'Garantia', icon: 'shield-check', required: false },
    { key: 'outros', label: 'Outros', icon: 'file', required: false },
];

export default function DocumentUploader({
    documents,
    onDocumentsChange,
    maxDocuments = 10
}: DocumentUploaderProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('nota_fiscal');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // ✅ Função para fazer upload real do arquivo
    const uploadFileToServer = async (uri: string, fileName: string, mimeType: string): Promise<string> => {
        const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://automazo-production.up.railway.app/api';

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('document', {
                uri,
                name: fileName,
                type: mimeType,
            } as any);

            const response = await fetch(`${API_BASE_URL}/upload/single`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erro no upload');
            }

            if (result.success && result.data) {
                return result.data.url; // Retorna a URL do arquivo no servidor
            } else {
                throw new Error('Resposta inválida do servidor');
            }
        } finally {
            setUploading(false);
        }
    };

    // ✅ Função para adicionar documento com upload automático
    const addDocumentWithUpload = async (newDocument: DocumentFile) => {
        try {
            if (documents.length >= maxDocuments) {
                Alert.alert('Limite atingido', `Máximo de ${maxDocuments} documentos permitidos.`);
                return;
            }

            // Adicionar documento temporariamente com status de upload
            const tempDocument = { ...newDocument, isUploading: true };
            const updatedDocuments = [...documents, tempDocument];
            onDocumentsChange(updatedDocuments);

            // Fazer upload para servidor
            const uploadedUrl = await uploadFileToServer(
                newDocument.uri,
                newDocument.name,
                newDocument.mimeType || 'application/octet-stream'
            );

            // Atualizar documento com URL do servidor
            const finalDocument = {
                ...newDocument,
                isUploading: false,
                uploadedUrl: uploadedUrl,
                uri: uploadedUrl // Atualizar URI para a URL do servidor
            };

            const finalDocuments = updatedDocuments.map(doc =>
                doc.id === newDocument.id ? finalDocument : doc
            );
            onDocumentsChange(finalDocuments);

        } catch (error) {
            console.error('Erro no upload:', error);
            Alert.alert('Erro no Upload', 'Não foi possível enviar o arquivo. Tente novamente.');

            // Remover documento com erro
            const documentsWithoutError = documents.filter(doc => doc.id !== newDocument.id);
            onDocumentsChange(documentsWithoutError);
        }
    };

    // Função original para adicionar sem upload (compatibilidade)
    const addDocument = (newDocument: DocumentFile) => {
        if (documents.length >= maxDocuments) {
            Alert.alert('Limite atingido', `Máximo de ${maxDocuments} documentos permitidos.`);
            return;
        }
        onDocumentsChange([...documents, newDocument]);
    };

    // Solicitar permissões
    const requestPermissions = async () => {
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

        if (mediaLibraryPermission.status !== 'granted' || cameraPermission.status !== 'granted') {
            Alert.alert(
                'Permissões necessárias',
                'Este app precisa de acesso à câmera e galeria para funcionar corretamente.'
            );
            return false;
        }
        return true;
    };

    // Adicionar documento via câmera
    const pickImageFromCamera = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                await addDocumentWithUpload({
                    id: Date.now().toString(),
                    uri: asset.uri,
                    name: `Foto_${Date.now()}.jpg`,
                    type: 'image',
                    category: selectedCategory as any,
                    size: asset.fileSize,
                    mimeType: 'image/jpeg',
                });
            }
        } catch (error) {
            console.error('Erro ao capturar foto:', error);
            Alert.alert('Erro', 'Não foi possível capturar a foto.');
        }
    };

    // Adicionar documento via galeria
    const pickImageFromGallery = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                await addDocumentWithUpload({
                    id: Date.now().toString(),
                    uri: asset.uri,
                    name: asset.fileName || `Imagem_${Date.now()}.jpg`,
                    type: 'image',
                    category: selectedCategory as any,
                    size: asset.fileSize,
                    mimeType: asset.mimeType || 'image/jpeg',
                });
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
        }
    };

    // Adicionar documento via seleção de arquivo
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const isPDF = asset.mimeType === 'application/pdf';

                await addDocumentWithUpload({
                    id: Date.now().toString(),
                    uri: asset.uri,
                    name: asset.name,
                    type: isPDF ? 'pdf' : 'image',
                    category: selectedCategory as any,
                    size: asset.size,
                    mimeType: asset.mimeType || undefined,
                });
            }
        } catch (error) {
            console.error('Erro ao selecionar documento:', error);
            Alert.alert('Erro', 'Não foi possível selecionar o documento.');
        }
    };

    // Remover documento
    const removeDocument = (documentId: string) => {
        Alert.alert(
            'Remover documento',
            'Tem certeza que deseja remover este documento?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => {
                        onDocumentsChange(documents.filter(doc => doc.id !== documentId));
                    }
                }
            ]
        );
    };

    // Mostrar opções de upload
    const showUploadOptions = () => {
        Alert.alert(
            'Adicionar Documento',
            'Escolha uma opção:',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Câmera', onPress: pickImageFromCamera },
                { text: 'Galeria', onPress: pickImageFromGallery },
                { text: 'Arquivo PDF', onPress: pickDocument },
            ]
        );
    };

    // Formatar tamanho do arquivo
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        const mb = bytes / (1024 * 1024);
        return mb < 1 ? `${(bytes / 1024).toFixed(0)}KB` : `${mb.toFixed(1)}MB`;
    };

    // Verificar se categoria tem documentos
    const getCategoryDocuments = (category: string) => {
        return documents.filter(doc => doc.category === category);
    };

    return (
        <View style={styles.container}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
                Documentação *
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
                Adicione documentos que comprovem a realização do serviço
            </Text>

            {/* Categorias */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                {DOCUMENT_CATEGORIES.map((cat) => {
                    const categoryDocs = getCategoryDocuments(cat.key);
                    const isSelected = selectedCategory === cat.key;
                    const hasDocuments = categoryDocs.length > 0;

                    return (
                        <Chip
                            key={cat.key}
                            selected={isSelected}
                            onPress={() => setSelectedCategory(cat.key)}
                            icon={cat.icon}
                            style={[
                                styles.categoryChip,
                                isSelected && styles.selectedCategoryChip,
                                hasDocuments && styles.categoryWithDocs
                            ]}
                            textStyle={[
                                isSelected && styles.selectedCategoryText,
                                hasDocuments && styles.categoryWithDocsText
                            ]}
                        >
                            {cat.label} {hasDocuments && `(${categoryDocs.length})`}
                            {cat.required && ' *'}
                        </Chip>
                    );
                })}
            </ScrollView>

            {/* Documentos da categoria selecionada */}
            <View style={styles.documentsContainer}>
                {getCategoryDocuments(selectedCategory).map((doc) => (
                    <Card key={doc.id} style={styles.documentCard}>
                        <Card.Content style={styles.documentContent}>
                            <View style={styles.documentInfo}>
                                <MaterialCommunityIcons
                                    name={doc.type === 'pdf' ? 'file-pdf-box' : 'image'}
                                    size={24}
                                    color={doc.isUploading ? AppColors.text : AppColors.primary}
                                />
                                <View style={styles.documentDetails}>
                                    <Text variant="bodyMedium" style={styles.documentName} numberOfLines={1}>
                                        {doc.name}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.documentSize}>
                                        {doc.type.toUpperCase()} • {formatFileSize(doc.size)}
                                    </Text>
                                    {doc.isUploading && (
                                        <Text variant="bodySmall" style={styles.uploadingText}>
                                            Enviando...
                                        </Text>
                                    )}
                                    {doc.uploadedUrl && (
                                        <Text variant="bodySmall" style={styles.uploadedText}>
                                            ✓ Enviado
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {!doc.isUploading && (
                                <TouchableOpacity
                                    onPress={() => removeDocument(doc.id)}
                                    style={styles.removeButton}
                                >
                                    <MaterialCommunityIcons name="close" size={20} color={AppColors.danger} />
                                </TouchableOpacity>
                            )}
                        </Card.Content>
                        {doc.isUploading && (
                            <View style={styles.progressContainer}>
                                <ProgressBar progress={0.5} color={AppColors.primary} />
                            </View>
                        )}
                    </Card>
                ))}

                {/* Botão adicionar */}
                <Button
                    mode="outlined"
                    onPress={showUploadOptions}
                    icon="plus"
                    style={styles.addButton}
                    disabled={documents.length >= maxDocuments}
                >
                    Adicionar {DOCUMENT_CATEGORIES.find(c => c.key === selectedCategory)?.label}
                </Button>
            </View>

            {/* Resumo */}
            <Card style={styles.summaryCard}>
                <Card.Content>
                    <Text variant="titleSmall" style={styles.summaryTitle}>
                        Resumo dos Documentos
                    </Text>
                    {DOCUMENT_CATEGORIES.map((cat) => {
                        const categoryDocs = getCategoryDocuments(cat.key);
                        const hasRequired = cat.required && categoryDocs.length === 0;

                        return (
                            <View key={cat.key} style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, hasRequired && styles.requiredMissing]}>
                                    {cat.label}{cat.required && ' *'}:
                                </Text>
                                <Text style={[styles.summaryValue, hasRequired && styles.requiredMissing]}>
                                    {categoryDocs.length} documento{categoryDocs.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        );
                    })}
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    sectionTitle: {
        color: AppColors.text,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        color: AppColors.secondary,
        marginBottom: 16,
    },
    categoriesContainer: {
        marginBottom: 16,
    },
    categoryChip: {
        marginRight: 8,
        backgroundColor: AppColors.gray,
    },
    selectedCategoryChip: {
        backgroundColor: AppColors.primary,
    },
    selectedCategoryText: {
        color: AppColors.text,
    },
    categoryWithDocs: {
        backgroundColor: '#28a745', // Verde success
    },
    categoryWithDocsText: {
        color: AppColors.white,
    },
    documentsContainer: {
        marginBottom: 16,
    },
    documentCard: {
        marginBottom: 8,
        elevation: 2,
    },
    documentContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    documentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    documentDetails: {
        marginLeft: 12,
        flex: 1,
    },
    documentName: {
        color: AppColors.text,
        fontWeight: '500',
    },
    documentSize: {
        color: AppColors.secondary,
        marginTop: 2,
    },
    removeButton: {
        padding: 4,
    },
    addButton: {
        borderColor: AppColors.primary,
        borderStyle: 'dashed',
    },
    summaryCard: {
        backgroundColor: AppColors.gray,
        elevation: 1,
    },
    summaryTitle: {
        color: AppColors.text,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryLabel: {
        color: AppColors.text,
        flex: 1,
    },
    summaryValue: {
        color: AppColors.secondary,
        fontWeight: '500',
    },
    requiredMissing: {
        color: AppColors.danger,
    },
    uploadingText: {
        color: AppColors.primary,
        fontStyle: 'italic',
    },
    uploadedText: {
        color: '#28a745', // Verde para sucesso
        fontWeight: '500',
    },
    progressContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
});
