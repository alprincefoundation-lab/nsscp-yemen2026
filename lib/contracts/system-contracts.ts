export type Safe<T> = T extends object ? { [K in keyof T]: Safe<T[K]> } : T;

export interface SystemContext {
  userId: string | null;
  roles: string[];
  permissions: string[];
  requestId: string;
  timestamp: number;
  source: string;
}

export interface DTO<T> {
  data: T;
  metadata: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;
