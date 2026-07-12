# 🏛️ NSSCP — Migration Execution Order Analysis

**Date:** 2026-07-10
**Auditor:** Principal Software Architect
**Scope:** 3 pending migrations vs Live Database (15 Legacy tables)
**Status:** 📋 READ-ONLY ANALYSIS — No migrations executed

---

# MIGRATION 1: 20260623134559_init_rbac_system

## Summary

| Attribute | Value |
|-----------|-------|
| **Purpose** | Initialize RBAC system + basic security domain |
| **Lines** | 300 |
| **Status** | ⚠️ PENDING — not applied to production database |

## Models Created

| # | Table | Fields | Conflict with Live DB? |
|---|-------|--------|----------------------|
| 1 | `AdminUser` | 7 (id, username, password, role, isActive, createdAt, updatedAt) | 🟢 NEW — does not exist |
| 2 | `AuditLog` | 13 (id, action, entityType, entityId, officerId, userId, details, ipAddress, userAgent, hierarchyEntityId, hierarchyEntityType, createdAt, updatedAt) | 🔴 CONFLICT — `AuditLog` already exists in DB with different schema |
| 3 | `User` | 16 (id, username, password, email, fullName, role, isActive, department, phoneNumber, avatar, governorateId, districtId, policeStationId, createdAt, updatedAt) | 🟢 NEW — does not exist |
| 4 | `Role` | 5 (id, name, description, createdAt, updatedAt) | 🟢 NEW |
| 5 | `Permission` | 5 (id, name, description, createdAt, updatedAt) | 🟢 NEW |
| 6 | `RolePermission` | 3 (roleId, permissionId, createdAt) | 🟢 NEW |
| 7 | `UserPermission` | 4 (id, userId, permissionId, roleId) | 🟢 NEW |
| 8 | `Governorate` | 4 (id, name, code, createdAt, updatedAt) | 🟢 NEW |
| 9 | `District` | 6 (id, name, code, governorateId, createdAt, updatedAt) | 🟢 NEW |
| 10 | `PoliceStation` | 7 (id, name, code, governorateId, districtId, createdAt, updatedAt) | 🟢 NEW |
| 11 | `Officer` | 16 (id, fullName, badgeNumber, rank, email, phoneNumber, isActive, userId, governorateId, districtId, policeStationId, departmentId, createdAt, updatedAt) | 🔴 CONFLICT — `Officer` already exists in DB with DIFFERENT schema (8 columns) |
| 12 | `Case` | 10 (id, caseNumber, title, description, caseType, status, priority, governorateId, districtId, createdAt, updatedAt) | 🟢 NEW |
| 13 | `CaseAssignment` | 5 (id, caseId, officerId, role, assignedAt) | 🟢 NEW |
| 14 | `Department` | 6 (id, name, code, createdAt, updatedAt, policeStationId) | 🟢 NEW |

## Enum Created

| Enum | Values |
|------|--------|
| `UserRole` | SUPER_ADMIN, MINISTRY_ADMIN, GOVERNORATE_ADMIN, DISTRICT_ADMIN, POLICE_ADMIN, OFFICER, VIEWER |

## Statement Classification

| # | SQL Statement | Affected Object | Classification | Notes |
|---|-------------|----------------|---------------|-------|
| 1 | `CREATE TYPE "UserRole"` | Enum | **SAFE_CREATE_ENUM** | New enum — no conflict |
| 2 | `CREATE TABLE "AdminUser"` | Table | **SAFE_CREATE_TABLE** | New table |
| 3 | `CREATE TABLE "AuditLog"` | Table | 🔴 **POTENTIAL_CONFLICT** | `AuditLog` already exists in DB with DIFFERENT schema (16 columns, different FK structure). This CREATE TABLE would **FAIL** |
| 4 | `CREATE TABLE "User"` | Table | **SAFE_CREATE_TABLE** | New table |
| 5 | `CREATE TABLE "Role"` | Table | **SAFE_CREATE_TABLE** | New table |
| 6 | `CREATE TABLE "Permission"` | Table | **SAFE_CREATE_TABLE** | New table |
| 7 | `CREATE TABLE "RolePermission"` | Table | **SAFE_CREATE_TABLE** | New table |
| 8 | `CREATE TABLE "UserPermission"` | Table | **SAFE_CREATE_TABLE** | New table |
| 9 | `CREATE TABLE "Governorate"` | Table | **SAFE_CREATE_TABLE** | New table |
| 10 | `CREATE TABLE "District"` | Table | **SAFE_CREATE_TABLE** | New table |
| 11 | `CREATE TABLE "PoliceStation"` | Table | **SAFE_CREATE_TABLE** | New table |
| 12 | `CREATE TABLE "Officer"` | Table | 🔴 **POTENTIAL_CONFLICT** | `Officer` already exists in DB with DIFFERENT schema. This CREATE TABLE would **FAIL** |
| 13 | `CREATE TABLE "Case"` | Table | **SAFE_CREATE_TABLE** | New table |
| 14 | `CREATE TABLE "CaseAssignment"` | Table | **SAFE_CREATE_TABLE** | New table |
| 15 | `CREATE TABLE "Department"` | Table | **SAFE_CREATE_TABLE** | New table |
| 16-52 | Various CREATE INDEX | Index | **SAFE_CREATE_INDEX** | All indexes on new tables |
| 53-82 | Various ALTER TABLE ADD FOREIGN KEY | Constraint | **SAFE_ADD_FOREIGN_KEY** | FKs between tables in this migration |

## Risk Assessment: 🔴 HIGH

**This migration will FAIL if applied because:**
1. `CREATE TABLE "AuditLog"` — table already exists
2. `CREATE TABLE "Officer"` — table already exists
3. Attempting to ADD FOREIGN KEY to `AuditLog` referencing tables (`User`, `Officer`) that won't be populated

---

# MIGRATION 2: 20260624020311_fakri

## Summary

| Attribute | Value |
|-----------|-------|
| **Purpose** | Expand database — restructure hierarchy, add all operational domains |
| **Lines** | 959 |
| **Status** | ⚠️ PENDING — not applied to production database |

## Models Created

| # | Table | Type | Conflict? |
|---|-------|------|----------|
| 1 | `HierarchyEntity` | self-ref hierarchy | 🟢 NEW |
| 2 | `DynamicForm` | form templates | 🟢 NEW |
| 3 | `DynamicField` | form fields | 🟢 NEW |
| 4 | `DynamicRecord` | form submissions | 🟢 NEW |
| 5 | `DynamicFile` | form attachments | 🟢 NEW |
| 6 | `ArchiveFolder` | archive | 🟢 NEW |
| 7 | `ArchiveDocument` | archive | 🟢 NEW |
| 8 | `DocumentVersion` | archive | 🟢 NEW |
| 9 | `Incident` | operations | 🟢 NEW |
| 10 | `Section` | hierarchy | 🟢 NEW |
| 11 | `Unit` | hierarchy | 🟢 NEW |
| 12 | `Promotion` | HR | 🟢 NEW |
| 13 | `Transfer` | HR | 🟢 NEW |
| 14 | `Leave` | HR | 🟢 NEW |
| 15 | `Penalty` | HR | 🟢 NEW |
| 16 | `WantedPerson` | wanted persons | 🟢 NEW (but NEW schema — different from Legacy) |
| 17 | `WantedAttachment` | wanted | 🟢 NEW |
| 18 | `Circular` | wanted | 🟢 NEW |
| 19 | `Prison` | prison | 🟢 NEW |
| 20 | `Cell` | prison | 🟢 NEW |
| 21 | `Prisoner` | prison | 🟢 NEW |
| 22 | `Visit` | prison | 🟢 NEW |
| 23 | `Operation` | operations | 🟢 NEW |
| 24 | `Patrol` | patrol | 🟢 NEW |
| 25 | `EmergencyCall` | emergency | 🟢 NEW |
| 26 | `Vehicle` | traffic | 🟢 NEW |
| 27 | `DrivingLicense` | traffic | 🟢 NEW |
| 28 | `TrafficViolation` | traffic | 🟢 NEW |

## Enums Created

| # | Enum | Values |
|---|------|--------|
| 1 | `HierarchyType` | MINISTRY, GOVERNORATE, DEPARTMENT, SECTION, UNIT |
| 2 | `FieldType` | TEXT, NUMBER, DATE, BOOLEAN, SELECT, MULTI_SELECT, TEXTAREA, FILE, IMAGE |
| 3 | `CaseStatus` | OPEN, UNDER_INVESTIGATION, PENDING_REVIEW, CLOSED, ARCHIVED |
| 4 | `CasePriority` | LOW, MEDIUM, HIGH, CRITICAL |
| 5 | `IncidentType` | THEFT, ASSAULT, TRAFFIC_ACCIDENT, DOMESTIC_VIOLENCE, NARCOTICS, FRAUD, HOMICIDE, PUBLIC_DISTURBANCE, OTHER |
| 6 | `IncidentStatus` | REPORTED, UNDER_INVESTIGATION, RESOLVED, UNFOUNDED |
| 7 | `VisitStatus` | SCHEDULED, COMPLETED, CANCELLED, REJECTED |
| 8 | `CellType` | SINGLE, SHARED, HIGH_SECURITY, SOLITARY_CONFINEMENT, MEDICAL |
| 9 | `PrisonerStatus` | REMAND, SENTENCED, PAROLE, ESCAPED, DECEASED, RELEASED, TRANSFERRED |
| 10 | `OperationStatus` | PLANNED, ACTIVE, COMPLETED, CANCELLED, STANDING_BY |
| 11 | `PatrolStatus` | ACTIVE, COMPLETED, CANCELLED, ON_BREAK |
| 12 | `EmergencyCallStatus` | RECEIVED, DISPATCHED, ON_SCENE, RESOLVED, CANCELLED |
| 13 | `TrafficViolationStatus` | ISSUED, PAID, DISPUTED, DISMISSED, REFERRED_TO_COURT |
| 14 | `LeaveType` | ANNUAL, SICK, EMERGENCY, MATERNITY, PATERNITY, UNPAID, TRAINING |
| 15 | `TransferType` | PROMOTIONAL, ROTATIONAL, DISCIPLINARY, VOLUNTARY, EMERGENCY |
| 16 | `PenaltyType` | WARNING, FINE, SUSPENSION, DEMOTION, DISMISSAL |

## 🔴 DESTRUCTIVE OPERATIONS FOUND

| # | Statement | Target | Classification | Data Loss Risk |
|---|----------|--------|---------------|----------------|
| 1 | `DROP TABLE "AdminUser"` | AdminUser table | 🔴 **DESTRUCTIVE_OPERATION** | Yes — if data exists |
| 2 | `DROP TABLE "District"` | District table | 🔴 **DESTRUCTIVE_OPERATION** | Yes — if data exists |
| 3 | `DROP TABLE "Governorate"` | Governorate table | 🔴 **DESTRUCTIVE_OPERATION** | Yes — if data exists |
| 4 | `DROP TABLE "PoliceStation"` | PoliceStation table | 🔴 **DESTRUCTIVE_OPERATION** | Yes — if data exists |
| 5 | `ALTER TABLE "Case" DROP COLUMN "districtId"` | Case | 🔴 **DESTRUCTIVE_OPERATION** | Yes — all values lost |
| 6 | `ALTER TABLE "Case" DROP COLUMN "governorateId"` | Case | 🔴 **DESTRUCTIVE_OPERATION** | Yes — all values lost |
| 7 | `ALTER TABLE "Department" DROP COLUMN "policeStationId"` | Department | 🔴 **DESTRUCTIVE_OPERATION** | Yes — all values lost |
| 8 | `ALTER TABLE "Officer" DROP COLUMN "districtId"` | Officer | 🔴 **DESTRUCTIVE_OPERATION** | Yes — all values lost |
| 9 | `ALTER TABLE "Officer" DROP COLUMN "governorateId"` | Officer | 🔴 **DESTRUCTIVE_OPERATION** | Yes — all values lost |
| 10 | `ALTER TABLE "Officer" DROP COLUMN "policeStationId"` | Officer | 🔴 **DESTRUCTIVE_OPERATION** | Yes — all values lost |
| 11 | `ALTER TABLE "User" DROP COLUMN "districtId"` | User | 🔴 **DESTRUCTIVE_OPERATION** | Yes — all values lost |
| 12 | `ALTER TABLE "User" DROP COLUMN "governorateId"` | User | 🔴 **DESTRUCTIVE_OPERATION** | Yes — all values lost |
| 13 | `ALTER TABLE "User" DROP COLUMN "policeStationId"` | User | 🔴 **DESTRUCTIVE_OPERATION** | Yes — all values lost |

## 🔶 DATA MIGRATION WARNINGS (from migration comments)

| # | Statement | Target | Classification |
|---|----------|--------|---------------|
| 1 | `ALTER TABLE "User" ADD COLUMN "militaryNumber" TEXT NOT NULL` | User | 🔴 **POTENTIAL_CONFLICT** — ADD COLUMN NOT NULL will fail if table has rows |
| 2 | `ALTER TABLE "User" ADD COLUMN "position" TEXT NOT NULL` | User | 🔴 **POTENTIAL_CONFLICT** |
| 3 | `ALTER TABLE "User" ADD COLUMN "province" TEXT NOT NULL` | User | 🔴 **POTENTIAL_CONFLICT** |
| 4 | `ALTER TABLE "User" ADD COLUMN "rank" TEXT NOT NULL` | User | 🔴 **POTENTIAL_CONFLICT** |
| 5 | `ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL` | User | 🔴 **POTENTIAL_CONFLICT** — fails if NULL exists |
| 6 | `ALTER TABLE "User" ALTER COLUMN "department" SET NOT NULL` | User | 🔴 **POTENTIAL_CONFLICT** |
| 7 | `CREATE UNIQUE INDEX "User_militaryNumber_key"` | User | 🔴 **POTENTIAL_CONFLICT** — fails if duplicates exist |

## Statement Classification Summary

| Category | Count |
|----------|-------|
| SAFE_CREATE_TABLE | 28 |
| SAFE_CREATE_ENUM | 16 |
| SAFE_CREATE_INDEX | ~40 |
| SAFE_ADD_COLUMN | ~12 |
| SAFE_ADD_FOREIGN_KEY | ~25 |
| **DESTRUCTIVE_OPERATION** | **13** 🔴 |
| **POTENTIAL_CONFLICT** | **7** 🔴 |

## Risk Assessment: 🔴 CRITICAL

**This migration contains 13 DESTRUCTIVE operations and 7 potential conflicts. It MUST NOT be applied as-is.**

---

# MIGRATION 3: wanted_persons_init

## Summary

| Attribute | Value |
|-----------|-------|
| **Purpose** | Document wanted persons management system |
| **Lines** | 17 |
| **Status** | ⚠️ PENDING — no SQL to execute |

## Statement Classification

| # | Content | Classification |
|---|---------|---------------|
| 1-17 | Comments only — "The actual migration is handled by Prisma's automatic schema synchronization" | **NO_OPERATION** |

## Risk Assessment: 🟢 LOW

This migration contains only comments/documentation. No SQL to execute.

---

# MIGRATION EXECUTION ORDER

## Dependency Graph

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  init_rbac_system (MUST RUN FIRST)                  │
│  Creates: UserRole enum, User, Role, Permission,    │
│           RolePermission, UserPermission,            │
│           Governorate, District, Department,         │
│           Case, CaseAssignment                      │
│  ⚠️ CONFLICT: AuditLog, Officer already exist       │
│                                                     │
│           ↓                                         │
│                                                     │
│  fakri (DEPENDS ON init_rbac_system)                │
│  Creates: 16 enums, 28 tables                       │
│  Destroys: 4 tables, 13 columns                     │
│  ⚠️ CRITICAL: 13 DROP operations                    │
│                                                     │
│           ↓                                         │
│                                                     │
│  wanted_persons_init (NO DEPENDENCIES)              │
│  Documentation only — no SQL                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Required Execution Order

| Order | Migration | Can Run? | Reason |
|-------|-----------|----------|--------|
| 1 | `20260623134559_init_rbac_system` | ❌ NO | Fails on CREATE TABLE AuditLog, CREATE TABLE Officer |
| 2 | `20260624020311_fakri` | ❌ NO | 13 DESTRUCTIVE operations + depends on init_rbac_system |
| 3 | `wanted_persons_init` | ✅ YES | No SQL — safe to mark as applied |

## Why These Migrations Cannot Be Applied

```
init_rbac_system:
  ❌ CREATE TABLE "AuditLog" → table already exists (different schema)
  ❌ CREATE TABLE "Officer" → table already exists (different schema)
  ❌ ALTER TABLE ADD FOREIGN KEY → references User table (created here but empty)

fakri:
  ❌ DROP TABLE "AdminUser" → destructive
  ❌ DROP TABLE "District" → destructive (created in init_rbac_system but empty)
  ❌ DROP TABLE "Governorate" → destructive
  ❌ DROP TABLE "PoliceStation" → destructive
  ❌ DROP COLUMN on Case, Officer, User → destructive (13 columns)
  ❌ ADD COLUMN NOT NULL on User → fails if User table has rows

wanted_persons_init:
  ✅ Documentation only — no SQL to execute
```

## Expected Database Changes (if applied)

| Change | init_rbac_system | fakri |
|--------|-----------------|-------|
| New Tables | 11 (excluding conflicts) | 28 |
| Altered Tables | 0 | 4 (Case, Department, Officer, User) |
| New Enums | 1 | 16 |
| New Indexes | 20+ | 40+ |
| New FKs | 30+ | 25+ |
| Dropped Tables | 0 | 4 |
| Dropped Columns | 0 | 13 |
| Column Type Changes | 0 | 4 (Case.status, Case.priority) |

---

# MIGRATION RISK SUMMARY

| Migration | Risk Level | Reason |
|-----------|-----------|--------|
| `20260623134559_init_rbac_system` | 🔴 **HIGH** | 2 table conflicts (AuditLog, Officer). Will FAIL if applied. |
| `20260624020311_fakri` | 🔴 **CRITICAL** | 13 DESTRUCTIVE operations + 7 potential conflicts. MUST NOT be applied as-is. |
| `wanted_persons_init` | 🟢 **LOW** | Documentation only. No SQL. Safe to mark as applied. |

## Overall Risk Assessment

```
These three migrations were designed for a FRESH database.
They assume no tables exist (CREATE TABLE for AuditLog, Officer).
They assume no data exists (ADD COLUMN NOT NULL, ALTER COLUMN SET NOT NULL).
They contain 13 DROP operations.

Applying them to the current production database (15 tables with data)
would result in:
  ❌ Migration failure on init_rbac_system (table conflict)
  ❌ Data loss if fakri is somehow applied (13 DROP COLUMNs)
  ❌ Migration history corruption

Verdict: THESE MIGRATIONS ARE NOT SAFE FOR PRODUCTION.
```

---

**End of Migration Execution Order Analysis — `MIGRATION_EXECUTION_ORDER.md`**