/**
 * Simulation Engine — Multi-region threat simulation with Yemen geographic data
 * Drives realistic threat generation across 8 provinces using golden-ratio intervals
 */

import { type DomainEvent, EventCategory, EventSeverity, EventStatus, createEventId, createCorrelationId } from './event-types';
import { eventBus } from './event-bus';
import { dataPurification } from './data-purification';
import { goldenRatioStore } from '../stores/golden-ratio-store';
import type { ProvinceThreat } from '../stores/types';

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618

// Yemen provinces with approximate center coordinates
const YEMEN_PROVINCES = [
  { name: 'Sana\'a', lat: 15.3694, lng: 44.191 },
  { name: 'Aden', lat: 12.8, lng: 45.03 },
  { name: 'Taiz', lat: 13.5789, lng: 44.0219 },
  { name: 'Hodeidah', lat: 14.7979, lng: 42.953 },
  { name: 'Hadramaut', lat: 15.9304, lng: 48.73 },
  { name: 'Marib', lat: 15.42, lng: 45.33 },
  { name: 'Lahj', lat: 13.05, lng: 44.88 },
  { name: 'Dhamar', lat: 14.5428, lng: 44.4048 },
] as const;

const THREAT_TYPES: ProvinceThreat['type'][] = [
  'drone', 'ied', 'military_convoy', 'border_incursion', 'smuggling_route',
  'communication_intercept', 'suspected_surveillance', 'patrol_sighting',
];

const THREAT_LABELS: Record<ProvinceThreat['type'], string> = {
  drone: 'Unidentified Aerial Object',
  ied: 'IED Detection',
  military_convoy: 'Military Convoy Movement',
  border_incursion: 'Border Incursion Alert',
  smuggling_route: 'Suspected Smuggling Activity',
  communication_intercept: 'Communication Intercept',
  suspected_surveillance: 'Surveillance Detection',
  patrol_sighting: 'Patrol Sighting Report',
};

const SEVERITY_WEIGHTS: Record<ProvinceThreat['type'], ProvinceThreat['severity'][]> = {
  drone: ['critical', 'high', 'medium'],
  ied: ['critical', 'critical', 'high'],
  military_convoy: ['high', 'medium', 'medium'],
  border_incursion: ['critical', 'high', 'high'],
  smuggling_route: ['medium', 'low', 'low'],
  communication_intercept: ['high', 'medium', 'medium'],
  suspected_surveillance: ['medium', 'medium', 'low'],
  patrol_sighting: ['low', 'low', 'medium'],
};

const THREAT_COLORS: Record<ProvinceThreat['severity'], string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

interface SimulationConfig {
  /** Base interval between waves in ms */
  baseInterval: number;
  /** Max threats per wave */
  maxThreatsPerWave: number;
  /** Probability a province generates a threat (0-1) */
  provinceThreatProbability: number;
  /** Enable/disable auto-cleanup */
  autoCleanup: boolean;
  /** TTL for threats in ms */
  threatTTL: number;
}

export class SimulationEngine {
  private static instance: SimulationEngine | null = null;
  private running = false;
  private waveTimer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private waveCount = 0;
  private config: SimulationConfig = {
    baseInterval: 3000,  // Golden-ratio-driven interval
    maxThreatsPerWave: 4,
    provinceThreatProbability: 0.6,
    autoCleanup: true,
    threatTTL: 60_000, // 60s
  };

  private constructor() {}

  static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    // Generate threats on golden-ratio intervals
    const interval = Math.round(this.config.baseInterval / PHI); // ~1854ms
    this.waveTimer = setInterval(() => this.generateWave(), interval);

    // Auto-cleanup expired threats
    if (this.config.autoCleanup) {
      this.cleanupTimer = setInterval(() => this.cleanupExpired(), 5000);
    }

    console.log(`[SimulationEngine] Started — wave interval: ${interval}ms`);
  }

  stop(): void {
    this.running = false;
    if (this.waveTimer) { clearInterval(this.waveTimer); this.waveTimer = null; }
    if (this.cleanupTimer) { clearInterval(this.cleanupTimer); this.cleanupTimer = null; }
    console.log('[SimulationEngine] Stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  private generateWave(): void {
    this.waveCount++;
    const activeProvinces = YEMEN_PROVINCES.filter(
      () => Math.random() < this.config.provinceThreatProbability
    );

    const threats: ProvinceThreat[] = [];

    for (const province of activeProvinces) {
      const numThreats = 1 + Math.floor(Math.random() * Math.min(2, this.config.maxThreatsPerWave));

      for (let i = 0; i < numThreats; i++) {
        const threatType = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)];
        const severities = SEVERITY_WEIGHTS[threatType];
        const severity = severities[Math.floor(Math.random() * severities.length)];

        // Add geographic jitter (±0.05 degrees ≈ ±5km)
        const jitterLat = (Math.random() - 0.5) * 0.1;
        const jitterLng = (Math.random() - 0.5) * 0.1;

        const threat: ProvinceThreat = {
          id: `sim_${this.waveCount}_${province.name.toLowerCase().replace(/[^a-z]/g, '')}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          lat: province.lat + jitterLat,
          lng: province.lng + jitterLng,
          severity,
          type: threatType,
          label: THREAT_LABELS[threatType],
          region: province.name,
          color: THREAT_COLORS[severity],
          ts: Date.now(),
        };

        threats.push(threat);

        const domainEvent: DomainEvent = {
          id: threat.id,
          type: `threat.${threatType}`,
          category: EventCategory.THREAT,
          severity: this.mapSeverity(severity),
          status: EventStatus.PENDING,
          source: 'simulation',
          region: province.name,
          payload: {
            threatId: threat.id,
            threatLevel: this.mapSeverity(severity),
            threatVector: threatType,
            affectedRegions: [province.name],
            escalationChain: [],
            estimatedImpact: severity === 'critical' ? 100 : severity === 'high' ? 75 : severity === 'medium' ? 50 : 25,
          },
          timestamp: Date.now(),
          correlationId: `wave_${this.waveCount}`,
          metadata: { threat },
          version: 1,
        };

        const purified = dataPurification.purify(domainEvent);
        eventBus.publish('simulation.threats', purified);
      }
    }

    if (threats.length > 0) {
      goldenRatioStore.setState({
        activeThreats: [...goldenRatioStore.getState().activeThreats, ...threats],
      });
    }
  }

  private mapSeverity(severity: ProvinceThreat['severity']): EventSeverity {
    const map: Record<string, EventSeverity> = {
      critical: EventSeverity.CRITICAL,
      high: EventSeverity.HIGH,
      medium: EventSeverity.MEDIUM,
      low: EventSeverity.LOW,
    };
    return map[severity] ?? EventSeverity.MEDIUM;
  }

  private cleanupExpired(): void {
    const store = goldenRatioStore.getState();
    const now = Date.now();
    const active = store.activeThreats.filter(t => now - t.ts < this.config.threatTTL);
    const expired = store.activeThreats.filter(t => now - t.ts >= this.config.threatTTL);

    if (expired.length > 0) {
      goldenRatioStore.setState({
        activeThreats: active,
        archivedThreats: [...store.archivedThreats.slice(-500), ...expired],
      });
    }
  }

  getWaveCount(): number {
    return this.waveCount;
  }

  getProvinceList() {
    return [...YEMEN_PROVINCES];
  }

  updateConfig(partial: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  destroy(): void {
    this.stop();
    SimulationEngine.instance = null;
  }
}

export const simulationEngine = SimulationEngine.getInstance();