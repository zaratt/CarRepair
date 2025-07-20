import { isFuture, isValid as isValidDate, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

interface ValidationRule {
    required?: boolean;
    minValue?: number;
    maxValue?: number;
    pattern?: RegExp;
    custom?: (value: any, formData?: any) => string | null;
}

interface ValidationRules {
    [key: string]: ValidationRule;
}

interface ValidationErrors {
    [key: string]: string | null;
}

interface LastMaintenanceData {
    date: string;
    mileage: number;
}

interface UseFormValidationReturn {
    errors: ValidationErrors;
    isValid: boolean;
    validateField: (name: string, value: any) => string | null;
    validateForm: () => boolean;
    clearError: (name: string) => void;
    getFieldError: (name: string) => string | null;
    hasErrors: boolean;
}

/**
 * Hook customizado para validação de formulários com regras específicas
 * Inclui validações para manutenção automotiva (data, quilometragem, valores)
 */
export const useFormValidation = (
    formData: any,
    rules: ValidationRules,
    lastMaintenanceData?: LastMaintenanceData
): UseFormValidationReturn => {
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Validação de data
    const validateDate = (dateValue: any): string | null => {
        if (!dateValue) return null;

        try {
            // Aceitar tanto string quanto objeto Date
            let dateToValidate: string;

            if (typeof dateValue === 'string') {
                dateToValidate = dateValue;
            } else if (dateValue instanceof Date) {
                dateToValidate = dateValue.toISOString();
            } else {
                return 'Formato de data inválido';
            }

            const date = parseISO(dateToValidate);

            if (!isValidDate(date)) {
                return 'Data inválida';
            }

            if (isFuture(date)) {
                return 'Não é possível registrar manutenções futuras';
            }

            // Não permitir datas muito antigas (mais de 5 anos)
            const fiveYearsAgo = new Date();
            fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

            if (date < fiveYearsAgo) {
                return 'Data muito antiga (máximo 5 anos)';
            }

            // Validar se é posterior à última manutenção
            if (lastMaintenanceData?.date) {
                const lastDate = parseISO(lastMaintenanceData.date);
                if (date < lastDate) {
                    const lastDateFormatted = lastDate.toLocaleDateString('pt-BR');
                    return `Data deve ser posterior à última manutenção (${lastDateFormatted})`;
                }
            }

            return null;
        } catch (error) {
            return 'Formato de data inválido';
        }
    };

    // Validação de quilometragem
    const validateMileage = (mileageStr: string): string | null => {
        if (!mileageStr) return null;

        // Remover formatação para validação
        const cleanMileage = mileageStr.replace(/\D/g, '');
        const numericMileage = Number(cleanMileage);

        if (isNaN(numericMileage)) {
            return 'Quilometragem deve ser um número';
        }

        if (numericMileage < 0) {
            return 'Quilometragem não pode ser negativa';
        }

        if (numericMileage > 9999999) {
            return 'Quilometragem muito alta (máximo 9.999.999 km)';
        }

        // Validar se é crescente em relação à última manutenção
        if (lastMaintenanceData?.mileage && numericMileage < lastMaintenanceData.mileage) {
            return `Quilometragem deve ser maior que ${lastMaintenanceData.mileage.toLocaleString('pt-BR')} km`;
        }

        // Alerta para quilometragem muito alta comparada à última
        if (lastMaintenanceData?.mileage && (numericMileage - lastMaintenanceData.mileage) > 50000) {
            return 'Diferença de quilometragem muito alta. Verifique o valor.';
        }

        return null;
    };

    // Validação de valor monetário
    const validateValue = (valueStr: string, rule: ValidationRule): string | null => {
        if (!valueStr) return null;

        // Remover formatação monetária para validação
        const cleanValue = valueStr.replace(/[R$\s.]/g, '').replace(',', '.');
        const numericValue = Number(cleanValue);

        if (isNaN(numericValue)) {
            return 'Valor deve ser um número';
        }

        if (numericValue < 0) {
            return 'Valor não pode ser negativo';
        }

        if (rule.minValue && numericValue < rule.minValue) {
            return `Valor mínimo é R$ ${rule.minValue.toFixed(2).replace('.', ',')}`;
        }

        if (rule.maxValue && numericValue > rule.maxValue) {
            return `Valor máximo é R$ ${rule.maxValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }

        if (numericValue > 50000) {
            return 'Valor muito alto. Verifique se está correto.';
        }

        if (numericValue > 0 && numericValue < 0.01) {
            return 'Valor muito baixo. Mínimo R$ 0,01';
        }

        return null;
    };

    // Validação de descrição
    const validateDescription = (description: string): string | null => {
        if (!description) return null;

        const trimmedDescription = description.trim();

        if (trimmedDescription.length < 3) {
            return 'Descrição deve ter pelo menos 3 caracteres';
        }

        if (trimmedDescription.length > 200) {
            return 'Descrição muito longa (máximo 200 caracteres)';
        }

        // Verificar se contém apenas números ou caracteres especiais
        if (/^[\d\s\W]+$/.test(trimmedDescription)) {
            return 'Descrição deve conter palavras válidas';
        }

        // Verificar se não contém apenas caracteres repetidos
        if (/^(.)\1+$/.test(trimmedDescription.replace(/\s/g, ''))) {
            return 'Descrição deve ser mais específica';
        }

        return null;
    };

    // Validação genérica
    const validateGeneric = (value: any, rule: ValidationRule): string | null => {
        if (rule.pattern && !rule.pattern.test(value)) {
            return 'Formato inválido';
        }

        if (rule.custom) {
            return rule.custom(value, formData);
        }

        return null;
    };

    // Função principal de validação de campo
    const validateField = (name: string, value: any): string | null => {
        const rule = rules[name];
        if (!rule) return null;

        // Campo obrigatório
        if (rule.required && (!value || value.toString().trim() === '')) {
            return 'Este campo é obrigatório';
        }

        // Se campo não é obrigatório e está vazio, não validar outras regras
        if (!rule.required && (!value || value.toString().trim() === '')) {
            return null;
        }

        // Validações específicas por campo
        switch (name) {
            case 'date':
                return validateDate(value);
            case 'mileage':
                return validateMileage(value);
            case 'value':
                return validateValue(value, rule);
            case 'description':
                return validateDescription(value);
            default:
                return validateGeneric(value, rule);
        }
    };

    // Validar formulário completo
    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};
        let hasErrors = false;

        Object.keys(rules).forEach(fieldName => {
            const error = validateField(fieldName, formData[fieldName]);
            newErrors[fieldName] = error;
            if (error) hasErrors = true;
        });

        setErrors(newErrors);
        return !hasErrors;
    };

    // Limpar erro específico
    const clearError = (name: string): void => {
        setErrors(prev => ({ ...prev, [name]: null }));
    };

    // Obter erro de campo
    const getFieldError = (name: string): string | null => {
        return errors[name] || null;
    };

    // Validação reativa quando formData muda (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            Object.keys(formData).forEach(fieldName => {
                if (rules[fieldName] && formData[fieldName] !== '' && formData[fieldName] != null) {
                    const error = validateField(fieldName, formData[fieldName]);
                    setErrors(prev => ({ ...prev, [fieldName]: error }));
                }
            });
        }, 300); // Debounce de 300ms

        return () => clearTimeout(timeoutId);
    }, [formData, rules, lastMaintenanceData]);

    // Verificar se formulário é válido
    const isValid = useMemo(() => {
        return Object.values(errors).every(error => !error);
    }, [errors]);

    // Verificar se há erros
    const hasErrors = useMemo(() => {
        return Object.values(errors).some(error => error !== null);
    }, [errors]);

    return {
        errors,
        isValid,
        validateField,
        validateForm,
        clearError,
        getFieldError,
        hasErrors
    };
};
