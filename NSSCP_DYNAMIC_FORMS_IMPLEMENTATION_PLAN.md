# 🏛️ NSSCP — Dynamic Forms & Archive System — Implementation Plan

## Architecture Overview

```
DataRecord (JSON) + GeneralAttachment (Files)
       ↓
   API Routes (/api/records, /api/attachments)
       ↓
  Dynamic Form Components (React/Tailwind)
       ↓
  Tactical Dashboard (Role-based views)
```

---

## File Creation Plan

### 1. API Routes (7 files)

| File | Method | Purpose |
|------|--------|---------|
| `app/api/records/route.ts` | GET | List DataRecords (filtered by Officer scope) |
| `app/api/records/route.ts` | POST | Create DataRecord with JSON data |
| `app/api/records/[id]/route.ts` | GET/PUT | Get/Update single record |
| `app/api/attachments/route.ts` | POST | Upload file attachment |
| `app/api/attachments/[id]/route.ts` | GET/DELETE | Get/Delete attachment |
| `app/api/records/stats/route.ts` | GET | Statistics by department |

### 2. UI Components (8 files)

| File | Purpose |
|------|---------|
| `components/dynamic-forms/DynamicFormContainer.tsx` | Main form wrapper with RBAC |
| `components/dynamic-forms/RecordList.tsx` | List of submitted records |
| `components/dynamic-forms/FormRenderer.tsx` | Renders form fields from schema |
| `components/dynamic-forms/FileUploader.tsx` | Multi-file upload with preview |
| `components/dynamic-forms/DepartmentSelector.tsx` | Department/case type selector |
| `components/forms/CriminalInvestigationForm.tsx` | CID form fields |
| `components/forms/PrisonForm.tsx` | Prison form fields |
| `components/forms/FacilitySecurityForm.tsx` | Facility security form |

### 3. Tactical Dashboard Pages (4 files)

| File | Purpose |
|------|---------|
| `app/tactical-dashboard/records/page.tsx` | Records overview |
| `app/tactical-dashboard/records/new/page.tsx` | New record form |
| `app/tactical-dashboard/records/[id]/page.tsx` | Record detail view |
| `app/tactical-dashboard/archive/page.tsx` | Archive search & view |

### 4. Utility Files (2 files)

| File | Purpose |
|------|---------|
| `lib/api-utils/record-guard.ts` | RBAC scope filter for DataRecords |
| `lib/forms/schemas.ts` | Pre-built form schemas for 4 departments |

---

## Execution Order

1. Create `lib/api-utils/record-guard.ts` (RBAC utility)
2. Create `lib/forms/schemas.ts` (form schemas)
3. Create `app/api/records/route.ts` (CRUD API)
4. Create `app/api/attachments/route.ts` (file upload API)
5. Create `components/dynamic-forms/*` (UI components)
6. Create `app/tactical-dashboard/records/*` (pages)
7. Test end-to-end flow

---

Ready to begin implementation.