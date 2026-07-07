export class WantedPersonsBusinessRules {
  // Severity escalation rules
  static canEscalateSeverity(currentSeverity: string, newSeverity: string): boolean {
    const hierarchy = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }
    return hierarchy[newSeverity] > hierarchy[currentSeverity]
  }

  // Capture eligibility
  static isEligibleForCapture(status: string): boolean {
    return status === 'ACTIVE' || status === 'PENDING_LOCATION'
  }

  // International notice publication rules
  static canPublishInternationalNotice(severity: string, status: string): boolean {
    return severity === 'CRITICAL' && (status === 'ACTIVE' || status === 'PENDING_LOCATION')
  }

  // Interpol cooperation rules
  static requiresInterpolCooperation(nationality: string, severity: string): boolean {
    const internationalCrimes = ['CRITICAL', 'HIGH']
    return internationalCrimes.includes(severity) && nationality !== 'Yemen'
  }

  // Status transition rules
  static allowedStatusTransitions = {
    ACTIVE: ['CAPTURED', 'DECEASED', 'PENDING_LOCATION'],
    CAPTURED: ['RELEASED', 'CONVICTED'],
    PENDING_LOCATION: ['ACTIVE', 'CAPTURED'],
    RELEASED: [],
    CONVICTED: [],
    DECEASED: [],
  }

  static canTransitionStatus(from: string, to: string): boolean {
    return this.allowedStatusTransitions[from]?.includes(to) ?? false
  }
}
