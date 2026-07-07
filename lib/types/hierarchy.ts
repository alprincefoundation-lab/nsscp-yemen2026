import { User, HierarchyEntity, HierarchyUser } from '@prisma/client';

export type Level3Unit = any;
export type Level4Department = any;
export type Level5Section = any;
export type Level6Unit = any;

export type LevelAssignment = any;
export type Officer = any;

export interface HierarchyStats {
  id?: string;
  name?: string;
  _count?: { users: number; incidents?: number };
}
export type HierarchyStatistics = HierarchyStats;

export type DataRecord = Record<string, any>;
export type FormFieldDefinition = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  label?: string;
  validation?: any;
  placeholder?: string;
  options?: any[];
};

export type BreadcrumbItem = any;
export type ApiResponse<T = any> = any;
