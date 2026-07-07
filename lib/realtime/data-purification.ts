/**
 * Data Purification — Validates, normalizes, and sanitizes domain events
 * Ensures all data flowing through the system is clean and consistent
 */

import type { DomainEvent } from './event-types';
import { EventSeverity, EventCategory } from './event-types';

interface PurificationResult {
  valid: boolean;
  sanitized: DomainEvent;
  warnings: string[];
}

class DataPurification {
  private static instance: DataPurification | null = null;

  private constructor() {}

  static getInstance(): DataPurification {
    if (!DataPurification.instance) {
      DataPurification.instance = new DataPurification();
    }
    return DataPurification.instance;
  }

  purify(event: DomainEvent): DomainEvent {
    const warnings: string[] = [];

    // Ensure required fields
    if (!event.id) {
      event.id = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      warnings.push('Generated missing event ID');
    }

    if (!event.timestamp || event.timestamp <= 0) {
      event.timestamp = Date.now();
      warnings.push('Corrected missing timestamp');
    }

    // Validate severity
    if (!Object.values(EventSeverity).includes(event.severity)) {
      event.severity = EventSeverity.MEDIUM;
      warnings.push('Normalized invalid severity to MEDIUM');
    }

    // Validate category
    if (!Object.values(EventCategory).includes(event.category)) {
      event.category = EventCategory.OPERATIONS;
      warnings.push('Normalized invalid category to OPERATIONS');
    }

    // Sanitize string fields
    event.region = this.sanitizeString(event.region ?? 'UNKNOWN');
    event.source = this.sanitizeString(event.source ?? 'UNKNOWN');
    event.type = this.sanitizeString(event.type ?? 'unknown');

    // Ensure metadata exists
    if (!event.metadata) {
      event.metadata = {};
    }

    event.metadata.purifiedAt = Date.now();
    if (warnings.length > 0) {
      event.metadata.purificationWarnings = warnings;
    }

    return event;
  }

  purifyBatch(events: DomainEvent[]): DomainEvent[] {
    return events.map(e => this.purify(e));
  }

  validate(event: DomainEvent): PurificationResult {
    const warnings: string[] = [];
    let valid = true;

    if (!event.id) { valid = false; warnings.push('Missing ID'); }
    if (!event.type) { valid = false; warnings.push('Missing type'); }
    if (!event.category) { valid = false; warnings.push('Missing category'); }
    if (!event.severity) { valid = false; warnings.push('Missing severity'); }
    if (!event.timestamp || event.timestamp <= 0) { valid = false; warnings.push('Invalid timestamp'); }

    return { valid, sanitized: this.purify(event), warnings };
  }

  private sanitizeString(value: string): string {
    return value
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim()
      .substring(0, 200);    // Limit length
  }

  destroy(): void {
    DataPurification.instance = null;
  }
}

export const dataPurification = DataPurification.getInstance();