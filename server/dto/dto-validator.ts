export type ValidationSchema = {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: string[];
  properties?: Record<string, FieldSchema>;
  items?: ValidationSchema;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: unknown[];
  nullable?: boolean;
  custom?: (value: unknown) => string | null;
};

export type FieldSchema = {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: unknown[];
  nullable?: boolean;
  default?: unknown;
  custom?: (value: unknown) => string | null;
  properties?: Record<string, FieldSchema>;
  items?: ValidationSchema;
};

export type ValidationResult<T = unknown> = {
  valid: boolean;
  errors: string[];
  data: T;
};

export type DTOConfig = {
  stripUnknown: boolean;
  coerceTypes: boolean;
  abortEarly: boolean;
};

const DEFAULT_CONFIG: DTOConfig = {
  stripUnknown: true,
  coerceTypes: true,
  abortEarly: false,
};

function coerceValue(value: unknown, targetType: string): unknown {
  if (value === null || value === undefined) return value;

  switch (targetType) {
    case 'string':
      return String(value);
    case 'number': {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    case 'boolean': {
      if (typeof value === 'string') {
        return value === 'true' || value === '1';
      }
      return Boolean(value);
    }
    default:
      return value;
  }
}

function validateField(
  name: string,
  value: unknown,
  schema: FieldSchema,
  config: DTOConfig,
): { errors: string[]; value: unknown } {
  const errors: string[] = [];
  let processedValue = value;

  if (value === null || value === undefined) {
    if (schema.required) {
      errors.push('Field "' + name + '" is required');
    }
    if (schema.default !== undefined) {
      processedValue = schema.default;
    }
    if (schema.nullable) {
      return { errors, value: processedValue };
    }
    return { errors, value: processedValue };
  }

  if (config.coerceTypes) {
    processedValue = coerceValue(processedValue, schema.type);
  }

  switch (schema.type) {
    case 'string':
      if (typeof processedValue !== 'string') {
        errors.push('Field "' + name + '" must be a string');
      } else {
        if (schema.minLength !== undefined && processedValue.length < schema.minLength) {
          errors.push('Field "' + name + '" must be at least ' + schema.minLength + ' characters');
        }
        if (schema.maxLength !== undefined && processedValue.length > schema.maxLength) {
          errors.push('Field "' + name + '" must be at most ' + schema.maxLength + ' characters');
        }
        if (schema.pattern && !new RegExp(schema.pattern).test(processedValue)) {
          errors.push('Field "' + name + '" does not match required pattern');
        }
      }
      break;

    case 'number':
      if (typeof processedValue !== 'number' || isNaN(processedValue)) {
        errors.push('Field "' + name + '" must be a number');
      } else {
        if (schema.min !== undefined && processedValue < schema.min) {
          errors.push('Field "' + name + '" must be at least ' + schema.min);
        }
        if (schema.max !== undefined && processedValue > schema.max) {
          errors.push('Field "' + name + '" must be at most ' + schema.max);
        }
      }
      break;

    case 'boolean':
      if (typeof processedValue !== 'boolean') {
        errors.push('Field "' + name + '" must be a boolean');
      }
      break;

    case 'object':
      if (typeof processedValue !== 'object' || Array.isArray(processedValue)) {
        errors.push('Field "' + name + '" must be an object');
      } else if (schema.properties) {
        const obj = processedValue as Record<string, unknown>;
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const propResult = validateField(name + '.' + propName, obj[propName], propSchema, config);
          errors.push(...propResult.errors);
          if (propResult.value !== undefined) {
            obj[propName] = propResult.value;
          }
        }
      }
      break;

    case 'array':
      if (!Array.isArray(processedValue)) {
        errors.push('Field "' + name + '" must be an array');
      } else {
        if (schema.minLength !== undefined && processedValue.length < schema.minLength) {
          errors.push('Field "' + name + '" must have at least ' + schema.minLength + ' items');
        }
        if (schema.maxLength !== undefined && processedValue.length > schema.maxLength) {
          errors.push('Field "' + name + '" must have at most ' + schema.maxLength + ' items');
        }
        if (schema.items) {
          const itemSchema: FieldSchema = {
            type: schema.items.type,
            required: Array.isArray(schema.items.required) ? false : schema.items.required,
            minLength: schema.items.minLength,
            maxLength: schema.items.maxLength,
            min: schema.items.min,
            max: schema.items.max,
            pattern: schema.items.pattern,
            enum: schema.items.enum,
            nullable: schema.items.nullable,
            custom: schema.items.custom,
            properties: schema.items.properties,
            items: schema.items.items,
          };
          for (let i = 0; i < processedValue.length; i++) {
            const itemResult = validateField(name + '[' + i + ']', processedValue[i], itemSchema, config);
            errors.push(...itemResult.errors);
            if (itemResult.value !== undefined) {
              processedValue[i] = itemResult.value;
            }
          }
        }
      }
      break;
  }

  if (schema.enum && !schema.enum.includes(processedValue)) {
    errors.push('Field "' + name + '" must be one of: ' + schema.enum.join(', '));
  }

  if (schema.custom) {
    const customError = schema.custom(processedValue);
    if (customError) {
      errors.push('Field "' + name + '": ' + customError);
    }
  }

  if (config.abortEarly && errors.length > 0) {
    return { errors: [errors[0]], value: processedValue };
  }

  return { errors, value: processedValue };
}

export function validateDTO<T = Record<string, unknown>>(
  data: unknown,
  schema: ValidationSchema,
  config: Partial<DTOConfig> = {},
): ValidationResult<T> {
  const resolvedConfig = { ...DEFAULT_CONFIG, ...config };
  const allErrors: string[] = [];

  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return {
        valid: false,
        errors: ['Input must be an object'],
        data: data as T,
      };
    }

    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
          allErrors.push('Field "' + field + '" is required');
        }
      }
    }

    if (schema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const fieldResult = validateField(fieldName, obj[fieldName], fieldSchema, resolvedConfig);
        allErrors.push(...fieldResult.errors);

        if (fieldResult.value !== undefined || !resolvedConfig.stripUnknown) {
          result[fieldName] = fieldResult.value;
        }

        if (resolvedConfig.stripUnknown && !(fieldName in (schema.properties || {}))) {
          delete result[fieldName];
        }
      }
    }

    if (resolvedConfig.stripUnknown && schema.properties) {
      const allowedKeys = new Set(Object.keys(schema.properties));
      for (const key of Object.keys(obj)) {
        if (!allowedKeys.has(key)) {
          delete result[key];
        }
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      data: result as T,
    };
  }

  if (schema.type === 'array') {
    if (!Array.isArray(data)) {
      return {
        valid: false,
        errors: ['Input must be an array'],
        data: data as T,
      };
    }

    const results: unknown[] = [];
    for (let i = 0; i < data.length; i++) {
      if (schema.items) {
        const itemSchema: FieldSchema = {
          type: schema.items.type,
          required: Array.isArray(schema.items.required) ? false : schema.items.required,
          minLength: schema.items.minLength,
          maxLength: schema.items.maxLength,
          min: schema.items.min,
          max: schema.items.max,
          pattern: schema.items.pattern,
          enum: schema.items.enum,
          nullable: schema.items.nullable,
          custom: schema.items.custom,
          properties: schema.items.properties,
          items: schema.items.items,
        };
        const itemResult = validateField('[' + i + ']', data[i], itemSchema, resolvedConfig);
        allErrors.push(...itemResult.errors);
        results.push(itemResult.value);
      } else {
        results.push(data[i]);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      data: results as T,
    };
  }

  return {
    valid: false,
    errors: ['Unsupported schema root type: ' + schema.type],
    data: data as T,
  };
}

export function createDTOValidator<T>(schema: ValidationSchema, config?: Partial<DTOConfig>) {
  return (data: unknown): ValidationResult<T> => validateDTO<T>(data, schema, config);
}