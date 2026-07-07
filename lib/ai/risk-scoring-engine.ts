export type RiskFactor = {
  name: string;
  weight: number;
  value: number;
  maxValue: number;
  description: string;
};

export type RiskScore = {
  totalScore: number;
  normalizedScore: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  region: string;
  eventType: string;
  computedAt: number;
  confidence: number;
};

export type FrequencySpike = {
  eventType: string;
  region: string;
  currentRate: number;
  baselineRate: number;
  spikeRatio: number;
  windowMs: number;
};

export type RegionCluster = {
  region: string;
  eventCount: number;
  anomalyCount: number;
  clusterScore: number;
  density: number;
};

export type TemporalBurst = {
  eventType: string;
  region: string;
  burstStart: number;
  burstEnd: number;
  eventCount: number;
  expectedCount: number;
  burstIntensity: number;
};

export type CrossEventCorrelation = {
  eventA: string;
  eventB: string;
  region: string;
  correlationStrength: number;
  coOccurrenceCount: number;
  timeWindowMs: number;
};

type EventRecord = {
  type: string;
  region: string;
  timestamp: number;
  value: number;
  isAnomaly: boolean;
};

function normalizeScore(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return Math.min(Math.max(score / maxScore, 0), 1);
}

function classifyLevel(normalizedScore: number): RiskScore['level'] {
  if (normalizedScore >= 0.9) return 'CRITICAL';
  if (normalizedScore >= 0.7) return 'HIGH';
  if (normalizedScore >= 0.4) return 'MEDIUM';
  return 'LOW';
}

function computeRate(events: EventRecord[], windowMs: number, now: number): number {
  const cutoff = now - windowMs;
  return events.filter(e => e.timestamp > cutoff).length / (windowMs / 1000);
}

function computeCorrelation(eventsA: EventRecord[], eventsB: EventRecord[], windowMs: number): number {
  let coOccurrences = 0;
  for (const a of eventsA) {
    for (const b of eventsB) {
      if (Math.abs(a.timestamp - b.timestamp) <= windowMs) {
        coOccurrences++;
        break;
      }
    }
  }
  const maxPossible = Math.min(eventsA.length, eventsB.length);
  return maxPossible > 0 ? coOccurrences / maxPossible : 0;
}

export class RiskScoringEngine {
  private eventHistory: EventRecord[] = [];
  private riskHistory: RiskScore[] = [];
  private maxHistorySize: number;
  private baselineWindowSizeMs: number;
  private burstWindowSizeMs: number;

  constructor(maxHistorySize: number = 50000, baselineWindowSizeMs: number = 300000, burstWindowSizeMs: number = 60000) {
    this.maxHistorySize = maxHistorySize;
    this.baselineWindowSizeMs = baselineWindowSizeMs;
    this.burstWindowSizeMs = burstWindowSizeMs;
  }

  recordEvent(type: string, region: string, timestamp: number, value: number, isAnomaly: boolean): void {
    this.eventHistory.push({ type, region, timestamp, value, isAnomaly });
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize / 2);
    }
  }

  computeRiskScore(eventType: string, region: string): RiskScore {
    const now = Date.now();
    const factors: RiskFactor[] = [];

    const frequencySpike = this.analyzeFrequencySpike(eventType, region, now);
    factors.push({
      name: 'frequency_spike',
      weight: 0.25,
      value: Math.min(frequencySpike.spikeRatio, 10),
      maxValue: 10,
      description: 'Frequency spike ratio: ' + frequencySpike.spikeRatio.toFixed(2) + 'x baseline',
    });

    const regionCluster = this.analyzeRegionCluster(region, now);
    factors.push({
      name: 'region_clustering',
      weight: 0.2,
      value: regionCluster.clusterScore,
      maxValue: 1,
      description: 'Region anomaly density: ' + (regionCluster.density * 100).toFixed(1) + '%',
    });

    const temporalBurst = this.analyzeTemporalBurst(eventType, region, now);
    factors.push({
      name: 'temporal_burst',
      weight: 0.25,
      value: temporalBurst.burstIntensity,
      maxValue: 10,
      description: 'Burst intensity: ' + temporalBurst.burstIntensity.toFixed(2) + 'x expected',
    });

    const correlations = this.analyzeCrossEventCorrelations(eventType, region, now);
    const maxCorrelation = correlations.length > 0
      ? Math.max(...correlations.map(c => c.correlationStrength))
      : 0;
    factors.push({
      name: 'cross_event_correlation',
      weight: 0.15,
      value: maxCorrelation,
      maxValue: 1,
      description: 'Max cross-event correlation: ' + (maxCorrelation * 100).toFixed(1) + '%',
    });

    const regionalAnomalies = this.eventHistory.filter(
      e => e.region === region && e.isAnomaly && e.timestamp > now - this.baselineWindowSizeMs,
    ).length;
    const anomalyDensity = regionalAnomalies / Math.max(this.eventHistory.filter(
      e => e.region === region && e.timestamp > now - this.baselineWindowSizeMs,
    ).length, 1);
    factors.push({
      name: 'anomaly_density',
      weight: 0.15,
      value: anomalyDensity,
      maxValue: 1,
      description: 'Regional anomaly density: ' + (anomalyDensity * 100).toFixed(1) + '%',
    });

    let totalScore = 0;
    let maxPossible = 0;
    for (const factor of factors) {
      totalScore += (factor.value / factor.maxValue) * factor.weight;
      maxPossible += factor.weight;
    }

    const normalizedScore = normalizeScore(totalScore, maxPossible);
    const level = classifyLevel(normalizedScore);

    const sampleSize = this.eventHistory.filter(
      e => e.region === region && e.timestamp > now - this.baselineWindowSizeMs,
    ).length;
    const confidence = Math.min(sampleSize / 100, 1);

    const riskScore: RiskScore = {
      totalScore,
      normalizedScore,
      level,
      factors,
      region,
      eventType,
      computedAt: now,
      confidence,
    };

    this.riskHistory.push(riskScore);
    if (this.riskHistory.length > 10000) {
      this.riskHistory = this.riskHistory.slice(-5000);
    }

    return riskScore;
  }

  computeRiskScoresForAllRegions(): RiskScore[] {
    const regions = new Set(this.eventHistory.map(e => e.region));
    const scores: RiskScore[] = [];
    for (const region of regions) {
      scores.push(this.computeRiskScore('*', region));
    }
    return scores;
  }

  analyzeFrequencySpike(eventType: string, region: string, now: number): FrequencySpike {
    const shortWindowMs = 30000;
    const longWindowMs = this.baselineWindowSizeMs;

    const regionEvents = this.eventHistory.filter(e =>
      (eventType === '*' || e.type === eventType) && e.region === region,
    );

    const currentRate = computeRate(regionEvents, shortWindowMs, now);
    const baselineRate = computeRate(regionEvents, longWindowMs, now);

    return {
      eventType,
      region,
      currentRate,
      baselineRate,
      spikeRatio: baselineRate > 0 ? currentRate / baselineRate : 0,
      windowMs: shortWindowMs,
    };
  }

  analyzeRegionCluster(region: string, now: number): RegionCluster {
    const windowEvents = this.eventHistory.filter(
      e => e.region === region && e.timestamp > now - this.baselineWindowSizeMs,
    );

    const anomalyCount = windowEvents.filter(e => e.isAnomaly).length;
    const density = windowEvents.length > 0 ? anomalyCount / windowEvents.length : 0;

    return {
      region,
      eventCount: windowEvents.length,
      anomalyCount,
      clusterScore: density,
      density,
    };
  }

  analyzeTemporalBurst(eventType: string, region: string, now: number): TemporalBurst {
    const windowEvents = this.eventHistory.filter(
      e => (eventType === '*' || e.type === eventType) && e.region === region && e.timestamp > now - this.burstWindowSizeMs,
    );

    const totalEvents = this.eventHistory.filter(
      e => (eventType === '*' || e.type === eventType) && e.region === region && e.timestamp > now - this.baselineWindowSizeMs,
    ).length;

    const expectedInBurst = totalEvents * (this.burstWindowSizeMs / this.baselineWindowSizeMs);
    const burstIntensity = expectedInBurst > 0 ? windowEvents.length / expectedInBurst : 0;

    return {
      eventType,
      region,
      burstStart: now - this.burstWindowSizeMs,
      burstEnd: now,
      eventCount: windowEvents.length,
      expectedCount: Math.round(expectedInBurst),
      burstIntensity,
    };
  }

  analyzeCrossEventCorrelations(eventType: string, region: string, now: number): CrossEventCorrelation[] {
    const correlations: CrossEventCorrelation[] = [];
    const windowMs = 10000;
    const recentEvents = this.eventHistory.filter(
      e => e.region === region && e.timestamp > now - this.burstWindowSizeMs,
    );

    const eventTypes = new Set(recentEvents.map(e => e.type));
    const targetEvents = recentEvents.filter(e => e.type === eventType);

    for (const otherType of eventTypes) {
      if (otherType === eventType) continue;
      const otherEvents = recentEvents.filter(e => e.type === otherType);
      const strength = computeCorrelation(targetEvents, otherEvents, windowMs);
      if (strength > 0.1) {
        correlations.push({
          eventA: eventType,
          eventB: otherType,
          region,
          correlationStrength: strength,
          coOccurrenceCount: Math.round(strength * Math.min(targetEvents.length, otherEvents.length)),
          timeWindowMs: windowMs,
        });
      }
    }

    return correlations;
  }

  getRiskHistory(count: number = 100): RiskScore[] {
    return this.riskHistory.slice(-count);
  }

  getHighestRiskRegions(limit: number = 5): RiskScore[] {
    const latestByRegion = new Map<string, RiskScore>();
    for (const score of this.riskHistory) {
      const existing = latestByRegion.get(score.region);
      if (!existing || score.computedAt > existing.computedAt) {
        latestByRegion.set(score.region, score);
      }
    }
    return Array.from(latestByRegion.values())
      .sort((a, b) => b.normalizedScore - a.normalizedScore)
      .slice(0, limit);
  }
}