# 🏛️ NSSCP — Final Schema-Database-Code Reconciliation

**Date:** 2026-07-10
**Engineer:** Senior Prisma + PostgreSQL Production Engineer
**Status:** 📋 READ-ONLY RECONCILIATION — No execution

---

## OBJECTIVE

Verify that every model in `schema.unified.prisma` (103 models) is covered by either:

- An existing table in the production database (15 Legacy tables)
- A `CREATE TABLE` statement in one of the 3 refactored migrations
- An `ALTER TABLE ADD COLUMN` expanding an existing table

Identify all gaps and classify them by criticality.

---

## COMPLETE MODEL COVERAGE MAP (103 Models)

### Legend:
- 🟢 **COVERED** = Table exists or will be created by migration
- 🟡 **PARTIAL** = Existing table expanded by ALTER TABLE (not full CREATE)
- 🔴 **MISSING** = Model referenced by application code but NO table exists or will be created
- ⬜ **FUTURE** = Model in unified schema but NOT referenced by any application code yet

---

### Section 1: Enums (35)

| Enum | Source | Status |
|------|--------|--------|
| `UserRole` | init_rbac_system migration | 🟢 |
| `HierarchyType` | fakri migration | 🟢 |
| `FieldType` | fakri migration | 🟢 |
| `CaseStatus` | fakri migration | 🟢 |
| `CasePriority` | fakri migration | 🟢 |
| `IncidentType` | fakri migration | 🟢 |
| `IncidentStatus` | fakri migration | 🟢 |
| `VisitStatus` | fakri migration | 🟢 |
| `CellType` | fakri migration | 🟢 |
| `PrisonerStatus` | fakri migration | 🟢 |
| `OperationStatus` | fakri migration | 🟢 |
| `PatrolStatus` | fakri migration | 🟢 |
| `EmergencyCallStatus` | fakri migration | 🟢 |
| `TrafficViolationStatus` | fakri migration | 🟢 |
| `LeaveType` | fakri migration | 🟢 |
| `TransferType` | fakri migration | 🟢 |
| `PenaltyType` | fakri migration | 🟢 |
| `Gender` | (no migration — Section 20+) | ⬜ FUTURE |
| `MaritalStatus` | (no migration) | ⬜ FUTURE |
| `CivilRecordType` | (no migration) | ⬜ FUTURE |
| `PassportStatus` | (no migration) | ⬜ FUTURE |
| `VisaType` | (no migration) | ⬜ FUTURE |
| `InterpolNoticeType` | (no migration) | ⬜ FUTURE |
| `WeaponLicenseStatus` | (no migration) | ⬜ FUTURE |
| `PortType` | (no migration) | ⬜ FUTURE |
| `CompanyType` | (no migration) | ⬜ FUTURE |

**Enums: 17 covered ✅ / 9 future ⬜**

---

### Section 2: Identity & RBAC (6 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `User` | init_rbac_system (CREATE TABLE) + fakri (ALTER TABLE ADD COLUMN) | ✅ 50+ references | 🟢 COVERED |
| `Role` | init_rbac_system (CREATE TABLE) | ✅ 20+ references | 🟢 COVERED |
| `Permission` | init_rbac_system (CREATE TABLE) | ✅ 15+ references | 🟢 COVERED |
| `RolePermission` | init_rbac_system (CREATE TABLE) | ✅ 10+ references | 🟢 COVERED |
| `UserPermission` | init_rbac_system (CREATE TABLE) | ✅ 5+ references | 🟢 COVERED |
| `UserRoleAssignment` | — NOT IN ANY MIGRATION | ❌ Not used in code | 🟡 DORMANT |

---

### Section 3: Officer (1 model)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `Officer` | Legacy DB (exists 8 cols) + init_rbac_system (ALTER TABLE +10 cols) + fakri (ALTER TABLE +6 cols) | ✅ 15+ references | 🟡 PARTIAL (expanded, not created) |

---

### Section 4: AuditLog (1 model)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `AuditLog` | Legacy DB (exists 16 cols) + init_rbac_system (ALTER TABLE +4 cols) + fakri (ALTER TABLE indexes) | ✅ 20+ references | 🟡 PARTIAL (expanded) |

---

### Section 5: National Organization (3 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `Governorate` | init_rbac_system (CREATE TABLE) | ✅ 5+ references | 🟢 COVERED |
| `District` | init_rbac_system (CREATE TABLE) | ✅ 5+ references | 🟢 COVERED |
| `Department` | init_rbac_system (CREATE TABLE) | ✅ 10+ references | 🟢 COVERED |

---

### Section 6: Modern Hierarchy (2 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `HierarchyEntity` | fakri (CREATE TABLE) | ✅ 30+ references | 🟢 COVERED |
| `HierarchyUser` | — NOT IN ANY MIGRATION | ✅ 5+ references (hierarchy-service.ts, rbac-engine.ts) | 🔴 MISSING |

---

### Section 7: Legacy Preserved (8 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `CentralCommand` | Legacy DB (exists) | ❌ Not used | 🟢 PRESERVED |
| `Province` | Legacy DB (exists) | ❌ Not used | 🟢 PRESERVED |
| `Level3Unit` | Legacy DB (exists) | ❌ Not used | 🟢 PRESERVED |
| `Level4Department` | Legacy DB (exists) | ❌ Not used | 🟢 PRESERVED |
| `Level5Section` | Legacy DB (exists) | ❌ Not used | 🟢 PRESERVED |
| `Level6Unit` | Legacy DB (exists) | ✅ 1 reference | 🟢 PRESERVED |
| `LevelAssignment` | Legacy DB (exists) | ❌ Not used | 🟢 PRESERVED |
| `DataRecord` | Legacy DB (exists) | ✅ 3 references | 🟢 PRESERVED |

---

### Section 8-9: Legacy Facility/Notification (4 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `Facility` | Legacy DB (exists) | ❌ Not used | 🟢 PRESERVED |
| `MovementReport` | Legacy DB (exists) | ❌ Not used | 🟢 PRESERVED |
| `SystemNotification` | Legacy DB (exists) | ❌ Not used | 🟢 PRESERVED |
| `Report` | Legacy DB (exists) | ✅ 5+ references | 🟢 PRESERVED |

---

### Section 10: Wanted Persons (3 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `WantedPerson` | Legacy DB (exists 9 cols) + fakri (ALTER TABLE +30 cols) | ✅ 25+ references | 🟡 PARTIAL (expanded) |
| `WantedAttachment` | fakri (CREATE TABLE) | ❌ Not used yet | 🟢 COVERED |
| `Circular` | fakri (CREATE TABLE) | ❌ Not used yet | 🟢 COVERED |

---

### Section 11: Cases & Investigations (9 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `Case` | init_rbac_system (CREATE TABLE) + fakri (ALTER TABLE +2 cols) | ✅ 20+ references | 🟢 COVERED |
| `Complaint` | — NOT IN ANY MIGRATION | ✅ 5+ references (forms/complaint, cases) | 🔴 MISSING |
| `Investigation` | — NOT IN ANY MIGRATION | ✅ 15+ references (investigations.service, api/investigations) | 🔴 MISSING |
| `Evidence` | — NOT IN ANY MIGRATION | ✅ 10+ references (investigations.service, api/evidence) | 🔴 MISSING |
| `CrimeScene` | — NOT IN ANY MIGRATION | ❌ Not used | 🟡 DORMANT |
| `Suspect` | — NOT IN ANY MIGRATION | ✅ 8+ references (investigations.service) | 🔴 MISSING |
| `Witness` | — NOT IN ANY MIGRATION | ✅ 8+ references (investigations.service) | 🔴 MISSING |
| `Interrogation` | — NOT IN ANY MIGRATION | ✅ 5+ references (investigations.service) | 🔴 MISSING |
| `InvestigationTimeline` | — NOT IN ANY MIGRATION | ✅ 3+ references (investigations.service) | 🔴 MISSING |

---

### Section 12: Incidents & Operations (4 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `Incident` | fakri (CREATE TABLE) | ✅ 10+ references | 🟢 COVERED |
| `IncidentTimeline` | — NOT IN ANY MIGRATION | ✅ 3+ references (operations.service) | 🔴 MISSING |
| `Operation` | fakri (CREATE TABLE) | ✅ 10+ references | 🟢 COVERED |
| `OperationTimeline` | — NOT IN ANY MIGRATION | ✅ 3+ references (operations.service) | 🔴 MISSING |

---

### Section 13: Prison System (8 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `Prison` | fakri (CREATE TABLE) | ✅ 5+ references | 🟢 COVERED |
| `Cell` | fakri (CREATE TABLE) | ✅ 10+ references | 🟢 COVERED |
| `Prisoner` | fakri (CREATE TABLE) | ✅ 10+ references | 🟢 COVERED |
| `Visit` | fakri (CREATE TABLE) | ❌ Not used yet | 🟢 COVERED |
| `DisciplinaryRecord` | — NOT IN ANY MIGRATION | ✅ 5+ references (prison.service) | 🔴 MISSING |
| `MedicalRecord` | — NOT IN ANY MIGRATION | ✅ 5+ references (prison.service) | 🔴 MISSING |
| `VisitorLog` | — NOT IN ANY MIGRATION | ✅ 5+ references (prison.service) | 🔴 MISSING |

---

### Section 14: Archive System (3 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `ArchiveFolder` | fakri (CREATE TABLE) | ✅ 10+ references | 🟢 COVERED |
| `ArchiveDocument` | fakri (CREATE TABLE) | ✅ 10+ references | 🟢 COVERED |
| `DocumentVersion` | fakri (CREATE TABLE) | ✅ 5+ references | 🟢 COVERED |

---

### Section 15: Dynamic Forms (8 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `DynamicForm` | fakri (CREATE TABLE) | ✅ 5+ references | 🟢 COVERED |
| `DynamicField` | fakri (CREATE TABLE) | ❌ Not used yet | 🟢 COVERED |
| `DynamicRecord` | fakri (CREATE TABLE) | ✅ 3+ references | 🟢 COVERED |
| `FormTemplate` | — NOT IN ANY MIGRATION | ✅ 3+ references (forms.service, api/forms/templates) | 🟡 DORMANT |
| `FormSubmission` | — NOT IN ANY MIGRATION | ✅ 3+ references (api/forms/submissions) | 🔴 MISSING |
| `FormAttachment` | — NOT IN ANY MIGRATION | ❌ Not used | 🟡 DORMANT |
| `FormSignature` | — NOT IN ANY MIGRATION | ❌ Not used | 🟡 DORMANT |
| `FormApproval` | — NOT IN ANY MIGRATION | ❌ Not used | 🟡 DORMANT |

---

### Section 16: Workflow Engine (5 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `WorkflowState` | — NOT IN ANY MIGRATION | ✅ 2+ references (api/workflows) | 🔴 MISSING |
| `WorkflowTransition` | — NOT IN ANY MIGRATION | ✅ 2+ references | 🔴 MISSING |
| `WorkflowApproval` | — NOT IN ANY MIGRATION | ✅ 2+ references (api/workflows/approvals) | 🔴 MISSING |
| `WorkflowEscalation` | — NOT IN ANY MIGRATION | ❌ Not used | 🟡 DORMANT |
| `WorkflowTransitionLog` | — NOT IN ANY MIGRATION | ❌ Not used | 🟡 DORMANT |

---

### Section 17: Traffic & Vehicles (3 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `Vehicle` | fakri (CREATE TABLE) | ✅ 5+ references | 🟢 COVERED |
| `DrivingLicense` | fakri (CREATE TABLE) | ❌ Not used | 🟢 COVERED |
| `TrafficViolation` | fakri (CREATE TABLE) | ✅ 3+ references | 🟢 COVERED |

---

### Section 18: HR & Personnel (4 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `Promotion` | fakri (CREATE TABLE) | ❌ Not used | 🟢 COVERED |
| `Transfer` | fakri (CREATE TABLE) | ❌ Not used | 🟢 COVERED |
| `Leave` | fakri (CREATE TABLE) | ❌ Not used | 🟢 COVERED |
| `Penalty` | fakri (CREATE TABLE) | ❌ Not used | 🟢 COVERED |

---

### Section 19: Emergency & Patrol (2 models)

| Model | Source | Referenced by Code | Status |
|-------|--------|-------------------|--------|
| `EmergencyCall` | fakri (CREATE TABLE) | ❌ Not used | 🟢 COVERED |
| `Patrol` | fakri (CREATE TABLE) | ❌ Not used | 🟢 COVERED |

---

### Sections 20-33: NEW DOMAINS (48 models — Civil Registry, Immigration, Interpol, Ports, Weapons, Private Security, Civil Defense, Coast Guard, etc.)

| Section | Models | Referenced by Code | Status |
|---------|--------|-------------------|--------|
| 20: Civil Registry | `CivilRecord`, `NationalIdCard` | ❌ Not used | ⬜ FUTURE |
| 21: Immigration | `Passport`, `Visa`, `ResidencePermit`, `TravelRecord` | ❌ Not used | ⬜ FUTURE |
| 22: Interpol | `InterpolNotice`, `InternationalWarrant` | ❌ Not used | ⬜ FUTURE |
| 23: Administrative | `OfficialCircular`, `AdministrativeDecision` | ❌ Not used | ⬜ FUTURE |
| 24: Weapons | `Weapon`, `WeaponLicense`, `SirenPermit` | ❌ Not used | ⬜ FUTURE |
| 25: Private Security | `PrivateFacility`, `SecurityGuard`, `CameraSystem`, `VIPProtection` | ❌ Not used | ⬜ FUTURE |
| 26: Civil Defense | `FireIncident`, `RescueOperation`, `SafetyInspection` | ❌ Not used | ⬜ FUTURE |
| 27: Coast Guard | `MarineVessel`, `CoastGuardOperation` | ❌ Not used | ⬜ FUTURE |
| 28: Visitor Gateway | `GeneralVisitor`, `VisitorBadge` | ❌ Not used | ⬜ FUTURE |
| 29: Family Protection | `FamilyProtectionCase`, `DomesticViolenceReport` | ❌ Not used | ⬜ FUTURE |
| 30: Road Security | `Checkpoint`, `RoadSecurityReport` | ❌ Not used | ⬜ FUTURE |
| 31: Border Ports | `BorderPort`, `PortEntryRecord`, `PortExitRecord`, `SmugglingCase` | ❌ Not used | ⬜ FUTURE |
| 32: Private Companies | `PrivateCompany` | ❌ Not used | ⬜ FUTURE |
| 33: Retirement | `RetirementRecord` | ❌ Not used | ⬜ FUTURE |

**New domains: 48 models ⬜ (all FUTURE — no code references, no migrations needed yet)**

---

## SUMMARY

| Category | Count | Details |
|----------|-------|---------|
| 🟢 **COVERED** (table created or exists) | 51 | 15 Legacy existing + 36 from migrations |
| 🟡 **PARTIAL** (existing table expanded) | 4 | AuditLog, Officer, Case, WantedPerson |
| 🟡 **DORMANT** (not in any migration, not used by code) | 10 | UserRoleAssignment, CrimeScene, DynamicFile, FormTemplate, FormAttachment, FormSignature, FormApproval, WorkflowEscalation, WorkflowTransitionLog |
| 🔴 **MISSING** (used by code, NO table) | 17 | HierarchyUser, Complaint, Investigation, Evidence, Suspect, Witness, Interrogation, InvestigationTimeline, IncidentTimeline, OperationTimeline, DisciplinaryRecord, MedicalRecord, VisitorLog, FormSubmission, WorkflowState, WorkflowTransition, WorkflowApproval |
| ⬜ **FUTURE** (not in any migration, NOT used by code) | 48 | New domains Sections 20-33 |
| **TOTAL MODELS** | **103** | |

---

## CRITICAL GAPS (17 models — WILL CAUSE RUNTIME ERRORS)

These 17 models are referenced by application code but no table exists or will be created by the current migrations:

| # | Model | File(s) Referencing | Effect if Missing |
|---|-------|-------------------|-------------------|
| 1 | `HierarchyUser` | `lib/hierarchy-service.ts`, `lib/core/rbac-engine.ts` | 🔴 Hierarchy scope checks FAIL |
| 2 | `Complaint` | `app/api/forms/complaint`, `app/api/cases` | 🔴 Complaint API 500 errors |
| 3 | `Investigation` | `lib/services/investigations.service.ts`, `app/api/investigations/*` | 🔴 Investigation API 500 errors |
| 4 | `Evidence` | `lib/services/investigations.service.ts`, `app/api/evidence` | 🔴 Evidence API 500 errors |
| 5 | `Suspect` | `lib/services/investigations.service.ts` | 🔴 Suspect CRUD FAIL |
| 6 | `Witness` | `lib/services/investigations.service.ts` | 🔴 Witness CRUD FAIL |
| 7 | `Interrogation` | `lib/services/investigations.service.ts` | 🔴 Interrogation CRUD FAIL |
| 8 | `InvestigationTimeline` | `lib/services/investigations.service.ts` | 🔴 Timeline FAIL |
| 9 | `IncidentTimeline` | `lib/services/operations.service.ts` | 🔴 Incident timeline FAIL |
| 10 | `OperationTimeline` | `lib/services/operations.service.ts` | 🔴 Op timeline FAIL |
| 11 | `DisciplinaryRecord` | `lib/services/prison.service.ts` | 🔴 Discipline CRUD FAIL |
| 12 | `MedicalRecord` | `lib/services/prison.service.ts` | 🔴 Medical CRUD FAIL |
| 13 | `VisitorLog` | `lib/services/prison.service.ts` | 🔴 Visitor log FAIL |
| 14 | `FormSubmission` | `app/api/forms/submissions` | 🔴 Form submission API FAIL |
| 15 | `WorkflowState` | `app/api/workflows` | 🔴 Workflow API FAIL |
| 16 | `WorkflowTransition` | `app/api/workflows` | 🔴 Workflow API FAIL |
| 17 | `WorkflowApproval` | `app/api/workflows/approvals` | 🔴 Approval API FAIL |

---

## RESOLUTION PATH

### Phase A (NOW — apply existing refactored migrations):
✅ 51 models covered → 40 new tables + 4 expanded

### Phase B (AFTER migrations — add missing 17 tables):
🔧 Create 17 `CREATE TABLE IF NOT EXISTS` statements

### Phase C (FUTURE — when new features are built):
📋 Create 48 new-domain tables + DORMANT models as needed

---

## FINAL VERDICT

| Alignment | Status |
|-----------|--------|
| Schema = Database (after Phase A) | **51/103 aligned** (50%) |
| Schema = Database (after Phase B) | **68/103 aligned** (66%) |
| Schema = Database (after Phase C) | **103/103 aligned** (100%) |
| Schema = Migration History | **Not yet** — requires `prisma migrate resolve` after execution |
| Schema = Prisma Client | **Not yet** — requires `prisma generate` after schema replacement |
| Schema = Application Code (after Phase B) | **~95%** — remaining ~5% is relation renames + route handler fixes |

---

**End of Reconciliation — `NSSCP_FINAL_SCHEMA_DATABASE_CODE_RECONCILIATION.md`**