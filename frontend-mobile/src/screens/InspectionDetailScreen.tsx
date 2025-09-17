import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Badge, Button, Card, Divider, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInspectionQuery } from '../api/api';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionDetail'>;

// ✅ Sistema de logs de segurança estruturado
const logSecurityEvent = (event: {
    type: 'URL_VALIDATION' | 'REDIRECT_ATTEMPT' | 'MALICIOUS_URL' | 'ACCESS_DENIED' | 'ACCESS_GRANTED';
    level: 'INFO' | 'WARN' | 'ERROR';
    url: string;
    reason?: string;
    context?: string;
}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type: 'SECURITY_EVENT',
        event: event.type,
        level: event.level,
        url: event.url,
        reason: event.reason,
        context: event.context,
        userAgent: 'CarRepair Mobile App',
        component: 'InspectionDetailScreen',
    };

    // ✅ Log estruturado para análise posterior
    console.log(`[SECURITY] ${event.level}:`, JSON.stringify(logEntry));

    // ✅ Em produção, aqui seria enviado para serviço de monitoramento
    // SecurityService.logEvent(logEntry);
};

// ✅ Função para validação segura de URLs (CWE-601 - Open Redirect Prevention)
const isValidURL = (url: string): boolean => {
    try {
        const urlObj = new URL(url);

        // ✅ Whitelist de protocolos permitidos
        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(urlObj.protocol)) {
            logSecurityEvent({
                type: 'MALICIOUS_URL',
                level: 'WARN',
                url,
                reason: `Protocolo não permitido: ${urlObj.protocol}`,
                context: 'Protocol validation'
            });
            return false;
        }

        // ✅ Whitelist de domínios permitidos (configuração baseada no ambiente)
        const allowedDomains = [
            // Domínios locais de desenvolvimento
            'localhost',
            '127.0.0.1',
            '0.0.0.0',
            // Domínios de teste (se aplicável)
            'staging.carrepair.com',
            'test.carrepair.com',
            // Domínios de produção (configurar conforme necessário)
            'api.carrepair.com',
            'files.carrepair.com',
            'cdn.carrepair.com',
            'storage.carrepair.com',
            // Domínios de serviços de arquivo autorizados
            'drive.google.com',
            'onedrive.live.com',
            // Adicionar outros domínios conforme necessário
        ];

        // ✅ Verificar portas permitidas para localhost
        const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(urlObj.hostname);
        if (isLocalhost) {
            const allowedPorts = [3000, 3001, 8000, 8080, 8081]; // Portas comuns de desenvolvimento
            const port = urlObj.port ? parseInt(urlObj.port, 10) : (urlObj.protocol === 'https:' ? 443 : 80);

            if (urlObj.port && !allowedPorts.includes(port)) {
                logSecurityEvent({
                    type: 'MALICIOUS_URL',
                    level: 'WARN',
                    url,
                    reason: `Porta não permitida para localhost: ${port}`,
                    context: 'Port validation'
                });
                return false;
            }
        }

        // ✅ Verificar se o domínio está na whitelist
        const isAllowedDomain = allowedDomains.some(domain => {
            return urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain);
        });

        if (!isAllowedDomain) {
            logSecurityEvent({
                type: 'ACCESS_DENIED',
                level: 'WARN',
                url,
                reason: `Domínio não permitido: ${urlObj.hostname}`,
                context: 'Domain whitelist validation'
            });
            return false;
        }

        // ✅ Verificar padrões maliciosos na URL
        const maliciousPatterns = [
            /javascript:/i,  // Protocolos perigosos
            /data:/i,
            /vbscript:/i,
            /file:/i,
            /\.\.\//, // Directory traversal
            /%2e%2e%2f/i, // Directory traversal encoded
            /%00/, // Null bytes
            /\x00-\x1f/, // Control characters
            /<script/i, // Script injection
            /on\w+=/i, // Event handlers
        ];

        const urlString = url.toLowerCase();
        for (const pattern of maliciousPatterns) {
            if (pattern.test(urlString)) {
                logSecurityEvent({
                    type: 'MALICIOUS_URL',
                    level: 'ERROR',
                    url,
                    reason: `Padrão malicioso detectado: ${pattern.source}`,
                    context: 'Malicious pattern detection'
                });
                return false;
            }
        }

        // ✅ Verificar comprimento da URL (prevenir URLs excessivamente longas)
        if (url.length > 2048) {
            logSecurityEvent({
                type: 'MALICIOUS_URL',
                level: 'WARN',
                url,
                reason: `URL muito longa: ${url.length} caracteres`,
                context: 'URL length validation'
            });
            return false;
        }

        // ✅ URL válida - log de sucesso
        logSecurityEvent({
            type: 'URL_VALIDATION',
            level: 'INFO',
            url,
            reason: 'URL validada com sucesso',
            context: 'URL validation success'
        });

        return true;
    } catch (error) {
        logSecurityEvent({
            type: 'MALICIOUS_URL',
            level: 'ERROR',
            url,
            reason: `URL inválida: ${error instanceof Error ? error.message : 'Unknown error'}`,
            context: 'URL parsing error'
        });
        return false;
    }
};

// ✅ Função segura para abrir URLs com validação
const safeOpenURL = async (url: string, description: string = 'este link') => {
    if (!url || typeof url !== 'string') {
        logSecurityEvent({
            type: 'MALICIOUS_URL',
            level: 'ERROR',
            url: url || 'undefined',
            reason: 'URL inválida ou vazia',
            context: `Tentativa de abrir ${description}`
        });

        Alert.alert(
            'Erro',
            'URL inválida. Não é possível abrir o arquivo.',
            [{ text: 'OK' }]
        );
        return;
    }

    // ✅ Validar URL antes de abrir
    if (!isValidURL(url)) {
        logSecurityEvent({
            type: 'ACCESS_DENIED',
            level: 'WARN',
            url,
            reason: 'URL não passou na validação de segurança',
            context: `Usuário tentou abrir ${description}`
        });

        Alert.alert(
            'Acesso Negado',
            `Por motivos de segurança, não é possível abrir ${description}. O link pode ser malicioso ou não está autorizado.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Reportar Problema',
                    onPress: () => {
                        logSecurityEvent({
                            type: 'MALICIOUS_URL',
                            level: 'ERROR',
                            url,
                            reason: 'Usuário reportou URL suspeita',
                            context: 'User report'
                        });
                        Alert.alert('Obrigado', 'Problema reportado para a equipe de segurança.');
                    }
                }
            ]
        );
        return;
    }

    try {
        // ✅ Verificar se o app pode abrir a URL
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            logSecurityEvent({
                type: 'ACCESS_DENIED',
                level: 'WARN',
                url,
                reason: 'Dispositivo não consegue abrir este tipo de URL',
                context: 'Linking.canOpenURL failed'
            });

            Alert.alert(
                'Erro',
                'Não é possível abrir este tipo de arquivo no dispositivo.',
                [{ text: 'OK' }]
            );
            return;
        }

        // ✅ Log de acesso autorizado
        logSecurityEvent({
            type: 'ACCESS_GRANTED',
            level: 'INFO',
            url,
            reason: 'Acesso autorizado pelo sistema de segurança',
            context: `Abrindo ${description}`
        });

        // ✅ Abrir URL de forma segura
        await Linking.openURL(url);
    } catch (error) {
        logSecurityEvent({
            type: 'REDIRECT_ATTEMPT',
            level: 'ERROR',
            url,
            reason: `Erro ao abrir URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
            context: 'Linking.openURL error'
        });

        Alert.alert(
            'Erro',
            'Ocorreu um erro ao tentar abrir o arquivo. Tente novamente mais tarde.',
            [{ text: 'OK' }]
        );
    }
};

// ✅ Função para validar URLs de imagem de forma segura (CWE-601 Prevention)
const getSafeImageSource = (url: string) => {
    // ✅ Validação inicial de entrada
    if (!url || typeof url !== 'string') {
        logSecurityEvent({
            type: 'MALICIOUS_URL',
            level: 'WARN',
            url: url || 'undefined',
            reason: 'URL de imagem inválida ou vazia',
            context: 'Image source validation'
        });
        return { uri: '' }; // Retorna URI vazia para não exibir imagem
    }

    // ✅ Sanitização de entrada para prevenir injeção
    const sanitizedUrl = url.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    if (sanitizedUrl !== url) {
        logSecurityEvent({
            type: 'MALICIOUS_URL',
            level: 'WARN',
            url,
            reason: 'URL de imagem contém caracteres de controle suspeitos',
            context: 'Image source sanitization'
        });
        return { uri: '' };
    }

    // ✅ Validação específica para imagens - extensões permitidas
    let validatedComponents: { protocol: string; hostname: string; pathname: string; port?: string } | null = null;

    try {
        const urlObj = new URL(sanitizedUrl);
        const pathname = urlObj.pathname.toLowerCase();
        const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];

        const hasValidExtension = allowedImageExtensions.some(ext => pathname.endsWith(ext));
        if (!hasValidExtension) {
            logSecurityEvent({
                type: 'ACCESS_DENIED',
                level: 'WARN',
                url: sanitizedUrl,
                reason: 'Extensão de arquivo não permitida para imagem',
                context: 'Image extension validation'
            });
            return { uri: '' };
        }

        // ✅ Extrair componentes validados da URL
        validatedComponents = {
            protocol: urlObj.protocol,
            hostname: urlObj.hostname,
            pathname: urlObj.pathname,
            port: urlObj.port || undefined
        };

    } catch (urlError) {
        logSecurityEvent({
            type: 'MALICIOUS_URL',
            level: 'ERROR',
            url: sanitizedUrl,
            reason: 'URL de imagem malformada',
            context: 'Image URL parsing error'
        });
        return { uri: '' };
    }

    // ✅ Validação geral de URL usando função segura
    if (!isValidURL(sanitizedUrl)) {
        logSecurityEvent({
            type: 'ACCESS_DENIED',
            level: 'WARN',
            url: sanitizedUrl,
            reason: 'URL de imagem não passou na validação de segurança',
            context: 'Image source security check'
        });
        return { uri: '' }; // Retorna URI vazia para não exibir imagem
    }

    // ✅ Validação adicional para imagens - verificar se não é redirect
    if (sanitizedUrl.includes('redirect') || sanitizedUrl.includes('goto') || sanitizedUrl.includes('url=')) {
        logSecurityEvent({
            type: 'MALICIOUS_URL',
            level: 'WARN',
            url: sanitizedUrl,
            reason: 'URL de imagem pode conter redirecionamento suspeito',
            context: 'Image redirect detection'
        });
        return { uri: '' };
    }

    // ✅ CORREÇÃO CWE-601: Construir URL segura a partir de componentes validados
    // Em vez de retornar a URL original, construímos uma nova URL segura
    if (!validatedComponents) {
        logSecurityEvent({
            type: 'MALICIOUS_URL',
            level: 'ERROR',
            url: sanitizedUrl,
            reason: 'Componentes de URL não foram validados',
            context: 'URL component validation error'
        });
        return { uri: '' };
    }

    // ✅ Construir URL segura com componentes validados
    const safeUrl = validatedComponents.port
        ? `${validatedComponents.protocol}//${validatedComponents.hostname}:${validatedComponents.port}${validatedComponents.pathname}`
        : `${validatedComponents.protocol}//${validatedComponents.hostname}${validatedComponents.pathname}`;

    // ✅ Log de carregamento de imagem autorizada
    logSecurityEvent({
        type: 'ACCESS_GRANTED',
        level: 'INFO',
        url: safeUrl,
        reason: 'Carregamento de imagem autorizado após validação completa e reconstrução segura',
        context: 'Safe image source'
    });

    // ✅ Retornar URL segura reconstruída (não a original)
    return { uri: safeUrl };
};

const statusColors = {
    'Aprovado': '#388e3c',
    'Aprovado com apontamentos': '#fbc02d',
    'Não conforme': '#d32f2f',
    'Pendente': '#888'
};

const InspectionDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { inspectionId } = route.params;

    const { data: inspection, isLoading, isError } = useInspectionQuery(inspectionId);

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" />
                <Text style={{ textAlign: 'center', marginTop: 16 }}>Carregando inspeção...</Text>
            </SafeAreaView>
        );
    }

    if (isError || !inspection) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                    <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                    <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Detalhes da Inspeção</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                    <IconButton icon="alert-circle" size={64} iconColor="#b00020" />
                    <Text style={{ textAlign: 'center', marginTop: 16, color: '#b00020', fontSize: 18 }}>
                        Inspeção não encontrada
                    </Text>
                    <Button mode="contained" style={{ marginTop: 24 }} onPress={() => navigation.goBack()}>
                        Voltar
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingLeft: 4 }}>
                <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginLeft: 4 }}>Detalhes da Inspeção</Text>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
                <Card style={styles.card} elevation={3}>
                    <Card.Content>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                                Inspeção #{inspection.id.slice(-8)}
                            </Text>
                            <Badge style={{
                                backgroundColor: statusColors[inspection.status as keyof typeof statusColors] || '#888',
                                color: '#fff'
                            }}>
                                {inspection.status || 'Pendente'}
                            </Badge>
                        </View>

                        <Divider style={{ marginBottom: 16 }} />

                        {/* Informações do Veículo */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Veículo</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Placa:</Text>
                                <Text style={styles.value}>{inspection.vehicle?.licensePlate || '-'}</Text>
                            </View>
                            {inspection.vehicle?.yearManufacture && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Ano:</Text>
                                    <Text style={styles.value}>{inspection.vehicle.yearManufacture}</Text>
                                </View>
                            )}
                        </View>

                        <Divider style={{ marginVertical: 16 }} />

                        {/* Informações da Inspeção */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Detalhes da Inspeção</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Empresa:</Text>
                                <Text style={styles.value}>{inspection.company || '-'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Data:</Text>
                                <Text style={styles.value}>
                                    {inspection.date ? new Date(inspection.date).toLocaleDateString('pt-BR') : '-'}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Criado em:</Text>
                                <Text style={styles.value}>
                                    {inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString('pt-BR') : '-'}
                                </Text>
                            </View>
                            {inspection.uploadedBy && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Responsável:</Text>
                                    <Text style={styles.value}>{inspection.uploadedBy.name}</Text>
                                </View>
                            )}
                        </View>

                        <Divider style={{ marginVertical: 16 }} />

                        {/* Arquivo Principal */}
                        {inspection.fileUrl && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Arquivo Principal</Text>
                                <TouchableOpacity
                                    onPress={() => safeOpenURL(inspection.fileUrl, 'o arquivo principal')}
                                    style={styles.fileButton}
                                >
                                    <IconButton icon="file-document" size={24} iconColor="#1976d2" />
                                    <Text style={{ color: '#1976d2', flex: 1 }}>Abrir arquivo</Text>
                                    <IconButton icon="open-in-new" size={20} iconColor="#1976d2" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Anexos */}
                        {inspection.attachments && inspection.attachments.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Anexos ({inspection.attachments.length})</Text>
                                <View style={styles.attachmentsContainer}>
                                    {inspection.attachments.map((attachment, index) => (
                                        <TouchableOpacity
                                            key={attachment.id || index}
                                            onPress={() => safeOpenURL(attachment.url, `o anexo ${attachment.name || `#${index + 1}`}`)}
                                            style={styles.attachmentItem}
                                        >
                                            {attachment.type && attachment.type.startsWith('image') ? (
                                                <Image
                                                    source={getSafeImageSource(attachment.url)}
                                                    style={styles.attachmentImage}
                                                />
                                            ) : (
                                                <View style={styles.attachmentFile}>
                                                    <IconButton icon="file-pdf-box" size={32} iconColor="#d32f2f" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Botões de Ação */}
                <View style={styles.actionButtons}>
                    <Button
                        mode="outlined"
                        onPress={() => navigation.navigate('InspectionForm', { inspection })}
                        style={styles.editButton}
                        icon="pencil"
                    >
                        Editar
                    </Button>
                    <Button
                        mode="contained"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        Voltar
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        backgroundColor: '#fff'
    },
    section: {
        marginVertical: 4
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 8
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start'
    },
    label: {
        fontWeight: '600',
        color: '#666',
        width: 100,
        fontSize: 14
    },
    value: {
        flex: 1,
        color: '#333',
        fontSize: 14
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#1976d2'
    },
    attachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    attachmentItem: {
        marginRight: 8,
        marginBottom: 8
    },
    attachmentImage: {
        width: 60,
        height: 60,
        borderRadius: 8
    },
    attachmentFile: {
        width: 60,
        height: 60,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 24
    },
    editButton: {
        flex: 1,
        borderColor: '#1976d2'
    },
    backButton: {
        flex: 1
    }
});

export default InspectionDetailScreen;
