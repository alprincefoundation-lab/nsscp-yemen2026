export type AnomalyDataPoint = {
  timestamp: number;
  value: number;
  region: string;
  eventType: string;
  metadata: Record<string, unknown>;
};

export type AnomalyDetection = {
  isAnomaly: boolean;
  score: number;
  threshold: number;
  reason: string;
  dataPoint: AnomalyDataPoint;
  baseline: StatisticalBaseline;
  detectedAt: number;
};

export type StatisticalBaseline = {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  sampleCount: number;
  lastUpdated: number;
  windowSize: number;
};

export type AdaptiveThreshold = {
  eventType: string;
  region: string;
  currentThreshold: number;
  initialThreshold: number;
  adaptationRate: number;
  confidenceLevel: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  lastAdjusted: number;
};

type BaselineWindow = {
  values: number[];
  timestamps: number[];
};

function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function computeZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return Math.abs(value - mean) / stdDev;
}

function exponentialMovingAverage(values: number[], alpha: number): number {
  if (values.length === 0) return 0;
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = alpha * values[i] + (1 - alpha) * ema;
  }
  return ema;
}

export class AnomalyAdaptiveModel {
  private windows: Map<string, BaselineWindow> = new Map();
  private baselines: Map<string, StatisticalBaseline> = new Map();
  private thresholds: Map<string, AdaptiveThreshold> = new Map();
  private detections: AnomalyDetection[] = [];
  private falsePositives: Map<string, number> = new Map();
  private falseNegatives: Map<string, number> = new Map();
  private totalDetections = 0;
  private totalAnomalies = 0;
  private windowSize: number;
  private defaultThreshold: number;
  private adaptationRate: number;

  constructor(windowSize: number = 100, defaultThreshold: number = 3.0, adaptationRate: number = 0.05) {
    this.windowSize = windowSize;
    this.defaultThreshold = defaultThreshold;
    this.adaptationRate = adaptationRate;
  }

  ingest(dataPoint: AnomalyDataPoint): AnomalyDetection {
    const key = this.getKey(dataPoint.eventType, dataPoint.region);
    let window = this.windows.get(key);
    if (!window) {
      window = { values: [], timestamps: [] };
      this.windows.set(key, window);
    }

    window.values.push(dataPoint.value);
    window.timestamps.push(dataPoint.timestamp);

    if (window.values.length > this.windowSize) {
      window.values = window.values.slice(-this.windowSize);
      window.timestamps = window.timestamps.slice(-this.windowSize);
    }

    this.updateBaseline(key, window);
    this.maybeAdaptThreshold(key, dataPoint);

    const baseline = this.baselines.get(key)!;
    const threshold = this.getThreshold(key);
    const zScore = computeZScore(dataPoint.value, baseline.mean, baseline.stdDev);
    const isAnomaly = zScore > threshold.currentThreshold && baseline.sampleCount >= 10;

    this.totalDetections++;
    if (isAnomaly) this.totalAnomalies++;

    const detection: AnomalyDetection = {
      isAnomaly,
      score: zScore,
      threshold: threshold.currentThreshold,
      reason: isAnomaly
        ? 'Z-score ' + zScore.toFixed(2) + ' exceeds adaptive threshold ' + threshold.currentThreshold.toFixed(2)
        : 'Within normal range',
      dataPoint,
      baseline,
      detectedAt: Date.now(),
    };

    this.detections.push(detection);
    if (this.detections.length > 10000) {
      this.detections = this.detections.slice(-5000);
    }

    return detection;
  }

  ingestBatch(dataPoints: AnomalyDataPoint[]): AnomalyDetection[] {
    return dataPoints.map(dp => this.ingest(dp));
  }

  getBaseline(eventType: string, region: string): StatisticalBaseline | null {
    return this.baselines.get(this.getKey(eventType, region)) ?? null;
  }

  getThreshold(eventType: string, region?: string): AdaptiveThreshold {
    const key = this.getKey(eventType, region ?? '*');
    let threshold = this.thresholds.get(key);
    if (!threshold) {
      threshold = {
        eventType,
        region: region ?? '*',
        currentThreshold: this.defaultThreshold,
        initialThreshold: this.defaultThreshold,
        adaptationRate: this.adaptationRate,
        confidenceLevel: 0,
        falsePositiveRate: 0,
        falseNegativeRate: 0,
        lastAdjusted: Date.now(),
      };
      this.thresholds.set(key, threshold);
    }
    return threshold;
  }

  reportFalsePositive(eventType: string, region: string): void {
    const key = this.getKey(eventType, region);
    const count = (this.falsePositives.get(key) || 0) + 1;
    this.falsePositives.set(key, count);

    const threshold = this.getThreshold(eventType, region);
    threshold.falsePositiveRate = count / Math.max(this.totalDetections, 1);
    threshold.currentThreshold = Math.min(
      threshold.currentThreshold * (1 + this.adaptationRate),
      threshold.initialThreshold * 3,
    );
    threshold.lastAdjusted = Date.now();
    this.thresholds.set(key, threshold);
  }

  reportFalseNegative(eventType: string, region: string): void {
    const key = this.getKey(eventType, region);
    const count = (this.falseNegatives.get(key) || 0) + 1;
    this.falseNegatives.set(key, count);

    const threshold = this.getThreshold(eventType, region);
    threshold.falseNegativeRate = count / Math.max(this.totalDetections, 1);
    threshold.currentThreshold = Math.max(
      threshold.currentThreshold * (1 - this.adaptationRate),
      threshold.initialThreshold * 0.3,
    );
    threshold.lastAdjusted = Date.now();
    this.thresholds.set(key, threshold);
  }

  getRecentDetections(count: number = 100, anomaliesOnly: boolean = false): AnomalyDetection[] {
    let filtered = this.detections;
    if (anomaliesOnly) {
      filtered = filtered.filter(d => d.isAnomaly);
    }
    return filtered.slice(-count);
  }

  getStats(): {
    totalDetections: number;
    totalAnomalies: number;
    anomalyRate: number;
    activeBaselines: number;
    activeThresholds: number;
  } {
    return {
      totalDetections: this.totalDetections,
      totalAnomalies: this.totalAnomalies,
      anomalyRate: this.totalDetections > 0 ? this.totalAnomalies / this.totalDetections : 0,
      activeBaselines: this.baselines.size,
      activeThresholds: this.thresholds.size,
    };
  }

  private updateBaseline(key: string, window: BaselineWindow): void {
    const mean = computeMean(window.values);
    const stdDev = computeStdDev(window.values, mean);
    const ema = exponentialMovingAverage(window.values, 0.1);

    this.baselines.set(key, {
      mean,
      stdDev,
      min: window.values.length > 0 ? Math.min(...window.values) : 0,
      max: window.values.length > 0 ? Math.max(...window.values) : 0,
      sampleCount: window.values.length,
      lastUpdated: Date.now(),
      windowSize: this.windowSize,
    });
  }

  private maybeAdaptThreshold(key: string, dataPoint: AnomalyDataPoint): void {
    const threshold = this.thresholds.get(key);
    if (!threshold) return;

    const fpKey = this.getKey(dataPoint.eventType, dataPoint.region);
    const fpCount = this.falsePositives.get(fpKey) || 0;
    const fnCount = this.falseNegatives.get(fpKey) || 0;
    const total = fpCount + fnCount;

    if (total > 0) {
      const fpRate = fpCount / Math.max(this.totalDetections, 1);
      const fnRate = fnCount / Math.max(this.totalDetections, 1);

      if (fpRate > 0.1) {
        threshold.currentThreshold = Math.min(
          threshold.currentThreshold * (1 + this.adaptationRate),
          threshold.initialThreshold * 3,
        );
      } else if (fnRate > 0.1) {
        threshold.currentThreshold = Math.max(
          threshold.currentThreshold * (1 - this.adaptationRate),
          threshold.initialThreshold * 0.3,
        );
      }

      const totalAnomalies = this.totalAnomalies;
      const totalDetections = this.totalDetections;
      threshold.confidenceLevel = totalDetections > 0
        ? 1 - (totalAnomalies / totalDetections) * 0.5
        : 0;
    }
  }

  private getKey(eventType: string, region: string): string {
    return eventType + ':' + region;
  }
}