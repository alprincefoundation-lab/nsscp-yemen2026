export type ValidatedEvent<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  source: string;
  region: string;
  timestamp: number;
  validatedAt: number;
  validationErrors: string[];
  isValid: boolean;
};

export type ValidationRule<T = unknown> = {
  name: string;
  validate: (event: T) => string | null;
  severity: 'error' | 'warning';
};

export type TypeSchema = {
  type: string;
  required: string[];
  properties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: unknown[];
  }>;
};

const SCHEMAS: Map<string, TypeSchema> = new Map();

export function registerSchema(eventType: string, schema: TypeSchema): void {
  SCHEMAS.set(eventType, schema);
}

export function unregisterSchema(eventType: string): void {
  SCHEMAS.delete(eventType);
}

function validateSchema(payload: unknown, schema: TypeSchema): string[] {
  const errors: string[] = [];

  if (typeof payload !== 'object' || payload === null) {
    errors.push('Payload must be an object');
    return errors;
  }

  const obj = payload as Record<string, unknown>;

  for (const field of schema.required) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      errors.push('Missing required field: ' + field);
    }
  }

  for (const [field, rules] of Object.entries(schema.properties)) {
    const value = obj[field];
    if (value === undefined || value === null) continue;

    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push('Field ' + field + ' expected string, got ' + typeof value);
    } else if (rules.type === 'number' && typeof value !== 'number') {
      errors.push('Field ' + field + ' expected number, got ' + typeof value);
    } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
      errors.push('Field ' + field + ' expected boolean, got ' + typeof value);
    } else if (rules.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      errors.push('Field ' + field + ' expected object');
    } else if (rules.type === 'array' && !Array.isArray(value)) {
      errors.push('Field ' + field + ' expected array');
    }

    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push('Field ' + field + ' shorter than minimum ' + rules.minLength);
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push('Field ' + field + ' longer than maximum ' + rules.maxLength);
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors.push('Field ' + field + ' does not match pattern ' + rules.pattern);
      }
    }

    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push('Field ' + field + ' below minimum ' + rules.min);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push('Field ' + field + ' above maximum ' + rules.max);
      }
    }

    if (rules.enum && !rules.enum.includes(value)) {
      errors.push('Field ' + field + ' not in allowed values');
    }
  }

  return errors;
}

function validateCommonFields(payload: unknown): string[] {
  const errors: string[] = [];

  if (payload === null || payload === undefined) {
    errors.push('Payload cannot be null or undefined');
    return errors;
  }

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const str = JSON.stringify(obj);
    if (str && str.length > 1048576) {
      errors.push('Payload exceeds maximum serialization size');
    }
  }

  return errors;
}

export class ValidationLayer<T = unknown> {
  private rules: Map<string, ValidationRule<unknown>[]> = new Map();
  private globalRules: ValidationRule<unknown>[] = [];
  private totalValidated = 0;
  private totalInvalid = 0;
  private listeners: Array<(event: ValidatedEvent<T>) => void> = [];

  addGlobalRule(rule: ValidationRule<unknown>): void {
    this.globalRules.push(rule);
  }

  addTypeRule(eventType: string, rule: ValidationRule<unknown>): void {
    const existing = this.rules.get(eventType) || [];
    existing.push(rule);
    this.rules.set(eventType, existing);
  }

  validate(event: { id: string; type: string; payload: T; source: string; region: string; timestamp: number }): ValidatedEvent<T> {
    const errors: string[] = [];

    errors.push(...validateCommonFields(event.payload));

    const schema = SCHEMAS.get(event.type);
    if (schema) {
      errors.push(...validateSchema(event.payload, schema));
    }

    for (const rule of this.globalRules) {
      const error = rule.validate(event.payload);
      if (error) {
        if (rule.severity === 'error') {
          errors.push('[' + rule.name + '] ' + error);
        }
      }
    }

    const typeRules = this.rules.get(event.type) || [];
    for (const rule of typeRules) {
      const error = rule.validate(event.payload);
      if (error) {
        if (rule.severity === 'error') {
          errors.push('[' + rule.name + '] ' + error);
        }
      }
    }

    this.totalValidated++;
    if (errors.length > 0) {
      this.totalInvalid++;
    }

    const validated: ValidatedEvent<T> = {
      ...event,
      validatedAt: Date.now(),
      validationErrors: errors,
      isValid: errors.length === 0,
    };

    this.notify(validated);
    return validated;
  }

  validateBatch(events: Array<{ id: string; type: string; payload: T; source: string; region: string; timestamp: number }>): ValidatedEvent<T>[] {
    return events.map(e => this.validate(e));
  }

  getStats(): { validated: number; invalid: number; rulesRegistered: number } {
    let ruleCount = this.globalRules.length;
    for (const rules of this.rules.values()) {
      ruleCount += rules.length;
    }
    return {
      validated: this.totalValidated,
      invalid: this.totalInvalid,
      rulesRegistered: ruleCount,
    };
  }

  onValidated(listener: (event: ValidatedEvent<T>) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private notify(event: ValidatedEvent<T>): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // listener errors do not block validation
      }
    }
  }
}