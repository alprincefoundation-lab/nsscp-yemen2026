/**
 * Universal Form Builder Types — NSSCP Platform
 *
 * Provides type-safe field definitions and form configuration
 * for the UniversalForm generic component. Integrates with
 * Prisma models, Zod schemas, and the RBAC hierarchy system.
 */
import type { Permission, Role } from '@/lib/permissions';
import { z } from "zod";
type DepartmentCode = string;

// ─── Field Type Enumeration ─────────────────────────────────

/**
 * Supported field types mapped to shadcn/ui and Radix primitives.
 * Extensible — add new types as needed.
 */
export type FormFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'multi-select'
  | 'date'
  | 'datetime-local'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'file'
  | 'hidden';

// ─── Select / Radio Options ─────────────────────────────────

export interface FieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

// ─── Field Config (Generic over FormValues) ─────────────────

export interface FieldConfig<TFormValues extends Record<string, any> = Record<string, any>> {
  /** Maps to the Prisma model field name (type-safe via keyof TFormValues) */
  name: keyof TFormValues & string;

  /** Arabic label shown in the UI */
  label: string;

  /** Input type determining the rendered control */
  type: FormFieldType;

  /** Placeholder text (for text/textarea/number/email/tel/url) */
  placeholder?: string;

  /** Whether this field is required by the Zod schema */
  required?: boolean;

  /** Whether this field is disabled (e.g. during edit of immutable fields) */
  disabled?: boolean;

  /**
   * Security: hide this field entirely based on RBAC context.
   * When true, the field is not rendered in the DOM (not just hidden via CSS).
   * Prevents sensitive data leakage in the client bundle.
   */
  hidden?: boolean;

  /** Options for select / multi-select / radio fields */
  options?: FieldOption[];

  /** Default value used when creating a new record */
  defaultValue?: any;

  /** Descriptive text shown beneath the input */
  description?: string;

  /**
   * Optional Zod refinement or custom validation message
   * that overrides the schema-level message for this specific field.
   */
  customErrorMessage?: string;

  /**
   * Permission required to VIEW this field.
   * If the user lacks this permission, the field is omitted
   * from the rendered form entirely.
   */
  viewPermission?: Permission;

  /**
   * Permission required to EDIT this field.
   * If the user lacks this permission, the field is rendered
   * as read-only (disabled). Requires viewPermission to be granted first.
   */
  editPermission?: Permission;
}

// ─── Form Configuration Props ───────────────────────────────

export interface UniversalFormProps<
  TFormValues extends Record<string, any>,
  TSubmitResult = unknown,
> {
  /** Array of field definitions (rendered in order) */
  fields: FieldConfig<TFormValues>[];

  /** Zod schema used for client-side AND server-side validation */
  schema: z.ZodSchema<TFormValues>;

  /**
   * Server Action or async function executed on valid submission.
   * Receives the validated & sanitized form data.
   * Must handle audit logging internally.
   */
  onSubmit: (data: TFormValues) => Promise<TSubmitResult>;

  /** Initial values (edit mode or pre-filled defaults) */
  defaultValues?: Partial<TFormValues>;

  /** Permissions required to SUBMIT the form */
  requiredPermissions?: Permission[];

  /** Role required to SUBMIT the form (least-privilege check) */
  requiredRole?: Role;

  /** Department code for RBAC scope filtering */
  departmentCode?: DepartmentCode;

  /** Override the submit button label (default: إرسال) */
  submitLabel?: string;

  /** Override the cancel button label (default: إلغاء) */
  cancelLabel?: string;

  /** Callback when user clicks cancel */
  onCancel?: () => void;

  /** Callback after successful submission */
  onSuccess?: (result: TSubmitResult) => void;

  /** Callback on submission error */
  onError?: (error: Error) => void;

  /** Form title (rendered in the header) */
  title?: string;

  /** Form description (rendered below the title) */
  description?: string;

  /** Edit mode flag — changes submit label to تحديث */
  isEditing?: boolean;

  /**
   * The hierarchy entity ID to which this record belongs.
   * Automatically injected for data isolation.
   */
  hierarchyEntityId?: string;

  /** Creation mode (create | edit) — defaults to 'create' */
  mode?: 'create' | 'edit';

  /** Additional CSS classes for the form container */
  className?: string;

  /** Whether to show a loading skeleton while async data loads */
  isLoading?: boolean;
}

// ─── Re-export Prisma enums for convenience ─────────────────

export { type DepartmentCode };
