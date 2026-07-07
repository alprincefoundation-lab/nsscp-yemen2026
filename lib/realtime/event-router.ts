/**
 * Event Router — Intelligent event routing with pattern matching and transformation
 * Routes events to appropriate handlers based on type, category, severity, and region
 */

import { type DomainEvent, type EventEnvelope, EventCategory, EventSeverity } from './event-types';
import { eventBus, type EventBus } from './event-bus';

export interface RouteRule {
  id: string;
  name: string;
  pattern: RoutePattern;
  transform?: (event: DomainEvent) => DomainEvent;
  targetTopics: string[];
  priority: number;
  enabled: boolean;
  rateLimit?: { maxPerSecond: number; currentCount: number; windowStart: number };
}

export interface RoutePattern {
  category?: EventCategory[];
  severity?: EventSeverity[];
  types?: string[];
  regions?: string[];
  sources?: string[];
  customMatch?: (event: DomainEvent) => boolean;
}

export class EventRouter {
  private static instance: EventRouter | null = null;
  private routes: RouteRule[] = [];
  private bus: EventBus;
  private routeMetrics: Map<string, { matched: number; delivered: number; rateLimited: number }> = new Map();

  private constructor(bus: EventBus) {
    this.bus = bus;
    this.initializeDefaultRoutes();
  }

  static getInstance(bus?: EventBus): EventRouter {
    if (!EventRouter.instance) {
      EventRouter.instance = new EventRouter(bus ?? eventBus);
    }
    return EventRouter.instance;
  }

  addRoute(rule: RouteRule): void {
    this.routes.push(rule);
    this.routes.sort((a, b) => b.priority - a.priority);
    this.routeMetrics.set(rule.id, { matched: 0, delivered: 0, rateLimited: 0 });
  }

  removeRoute(ruleId: string): void {
    this.routes = this.routes.filter(r => r.id !== ruleId);
    this.routeMetrics.delete(ruleId);
  }

  toggleRoute(ruleId: string, enabled: boolean): void {
    const route = this.routes.find(r => r.id === ruleId);
    if (route) route.enabled = enabled;
  }

  async route(topic: string, event: DomainEvent): Promise<void> {
    const envelope: EventEnvelope = {
      id: `rtr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
      event,
      channel: topic,
      publishedAt: Date.now(),
      publishedBy: event.source,
      retryCount: 0,
      maxRetries: 3,
      deadLettered: false,
    };

    for (const rule of this.routes) {
      if (!rule.enabled) continue;

      if (this.matchesPattern(event, rule.pattern)) {
        const metrics = this.routeMetrics.get(rule.id);
        if (metrics) metrics.matched++;

        // Check rate limit
        if (rule.rateLimit) {
          const now = Date.now();
          if (now - rule.rateLimit.windowStart > 1000) {
            rule.rateLimit.windowStart = now;
            rule.rateLimit.currentCount = 0;
          }
          if (rule.rateLimit.currentCount >= rule.rateLimit.maxPerSecond) {
            if (metrics) metrics.rateLimited++;
            continue;
          }
          rule.rateLimit.currentCount++;
        }

        // Transform if needed
        const finalEvent = rule.transform ? rule.transform(event) : event;

        // Publish to target topics
        for (const targetTopic of rule.targetTopics) {
          await this.bus.publish(targetTopic, finalEvent);
          const m = this.routeMetrics.get(rule.id);
          if (m) m.delivered++;
        }
      }
    }
  }

  private matchesPattern(event: DomainEvent, pattern: RoutePattern): boolean {
    if (pattern.category && pattern.category.length > 0) {
      if (!pattern.category.includes(event.category)) return false;
    }
    if (pattern.severity && pattern.severity.length > 0) {
      if (!pattern.severity.includes(event.severity)) return false;
    }
    if (pattern.types && pattern.types.length > 0) {
      if (!pattern.types.includes(event.type)) return false;
    }
    if (pattern.regions && pattern.regions.length > 0) {
      if (!pattern.regions.includes(event.region)) return false;
    }
    if (pattern.sources && pattern.sources.length > 0) {
      if (!pattern.sources.includes(event.source)) return false;
    }
    if (pattern.customMatch) {
      if (!pattern.customMatch(event)) return false;
    }
    return true;
  }

  private initializeDefaultRoutes(): void {
    // Critical security events → immediate alert channel
    this.addRoute({
      id: 'route-critical-security',
      name: 'Critical Security Alerts',
      pattern: {
        category: [EventCategory.SECURITY],
        severity: [EventSeverity.CRITICAL, EventSeverity.EMERGENCY],
      },
      targetTopics: ['alerts.critical', 'command.security'],
      priority: 100,
      enabled: true,
    });

    // Threat events → threat intelligence channel
    this.addRoute({
      id: 'route-threats',
      name: 'Threat Intelligence Feed',
      pattern: {
        category: [EventCategory.THREAT],
      },
      targetTopics: ['intelligence.threats', 'command.threats'],
      priority: 90,
      enabled: true,
    });

    // Anomaly events → anomaly analysis channel
    this.addRoute({
      id: 'route-anomalies',
      name: 'Anomaly Detection Feed',
      pattern: {
        category: [EventCategory.ANOMALY],
      },
      targetTopics: ['intelligence.anomalies', 'analytics.anomalies'],
      priority: 80,
      enabled: true,
    });

    // Operations events → ops dashboard
    this.addRoute({
      id: 'route-operations',
      name: 'Operations Dashboard',
      pattern: {
        category: [EventCategory.OPERATIONS],
      },
      targetTopics: ['dashboard.operations'],
      priority: 70,
      enabled: true,
    });

    // System health events
    this.addRoute({
      id: 'route-system-health',
      name: 'System Health Monitor',
      pattern: {
        category: [EventCategory.SYSTEM],
        severity: [EventSeverity.HIGH, EventSeverity.CRITICAL, EventSeverity.EMERGENCY],
      },
      targetTopics: ['system.health', 'alerts.system'],
      priority: 85,
      enabled: true,
    });

    // All events → analytics pipeline
    this.addRoute({
      id: 'route-analytics',
      name: 'Analytics Pipeline',
      pattern: {},
      targetTopics: ['analytics.all'],
      priority: 1,
      enabled: true,
    });

    // Command events → command center
    this.addRoute({
      id: 'route-commands',
      name: 'Command Center',
      pattern: {
        category: [EventCategory.COMMAND],
      },
      targetTopics: ['command.center', 'dashboard.commands'],
      priority: 95,
      enabled: true,
    });
  }

  getRoutes(): RouteRule[] {
    return [...this.routes];
  }

  getRouteMetrics(): Map<string, { matched: number; delivered: number; rateLimited: number }> {
    return new Map(this.routeMetrics);
  }

  destroy(): void {
    this.routes = [];
    this.routeMetrics.clear();
    EventRouter.instance = null;
  }
}

export const eventRouter = EventRouter.getInstance();