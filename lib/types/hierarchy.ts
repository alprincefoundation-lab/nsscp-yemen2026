export interface Level3Unit {
  id: string
  name: string
  code: string
  provinceId: string
}

export interface Level4Department {
  id: string
  name: string
  code: string
  level3UnitId: string
}

export interface Level5Section {
  id: string
  name: string
  code: string
  level4DepartmentId: string
}

export interface Level6Unit {
  id: string
  name: string
  code: string
  level5SectionId: string
}

export interface LevelAssignment {
  id: string
  officerId: string
  unitId: string
  level?: number | null
  canRead?: boolean | null
  canWrite?: boolean | null
  canApprove?: boolean | null
}

export interface Officer {
  id: string
  name: string
  rank?: string | null
  role?: string | null
  department?: string | null
  accessLevel?: number | null
}

export interface HierarchyStats {
  id?: string
  name?: string
  _count?: { users: number; incidents?: number }
}

export type HierarchyStatistics = HierarchyStats

export type DataRecord = Record<string, unknown>

export type FormFieldDefinition = {
  id: string
  name: string
  type: string
  required: boolean
  label?: string
  validation?: unknown
  placeholder?: string
  options?: unknown[]
}

export interface BreadcrumbItem {
  id: string
  name: string
  type: string
  level: number
}

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
