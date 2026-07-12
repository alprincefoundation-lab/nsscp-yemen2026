-- ============================================================================
-- REFACTORED: 20260624020311_fakri
-- Original purpose: Expand database — hierarchy, operations, prison, traffic
-- Refactored: 2026-07-10 — Production-safe version
--
-- Changes from original:
--   ✅ REMOVED: 4 DROP TABLE (AdminUser, District, Governorate, PoliceStation)
--   ✅ REMOVED: 12 DROP CONSTRAINT/FK statements
--   ✅ REMOVED: 9 DROP COLUMN statements
--   ✅ REMOVED: 2 DROP COLUMN + ADD COLUMN (type changes on Case)
--   ✅ RELAXED: 4 ADD COLUMN NOT NULL → ADD COLUMN (nullable)
--   ✅ REMOVED: 2 ALTER COLUMN SET NOT NULL
--   ✅ REMOVED: 1 WantedPerson CREATE TABLE → ALTER TABLE ADD COLUMN
--   ✅ ALL enums: wrapped with existence check
--   ✅ ALL tables: CREATE TABLE IF NOT EXISTS
--   ✅ ALL indexes: CREATE INDEX IF NOT EXISTS
--   ✅ ALL foreign keys: wrapped with duplicate_object guard
--   ✅ DESTRUCTIVE operations removed: 15 (was 13 + 2 type changes)
-- ============================================================================

-- ============================================================================
-- ENUMS (16 — all with existence checks)
-- ============================================================================

DO $$ BEGIN CREATE TYPE "HierarchyType" AS ENUM ('MINISTRY', 'GOVERNORATE', 'DEPARTMENT', 'SECTION', 'UNIT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'TEXTAREA', 'FILE', 'IMAGE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'PENDING_REVIEW', 'CLOSED', 'ARCHIVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "IncidentType" AS ENUM ('THEFT', 'ASSAULT', 'TRAFFIC_ACCIDENT', 'DOMESTIC_VIOLENCE', 'NARCOTICS', 'FRAUD', 'HOMICIDE', 'PUBLIC_DISTURBANCE', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "IncidentStatus" AS ENUM ('REPORTED', 'UNDER_INVESTIGATION', 'RESOLVED', 'UNFOUNDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'UNPAID', 'TRAINING'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TransferType" AS ENUM ('PROMOTIONAL', 'ROTATIONAL', 'DISCIPLINARY', 'VOLUNTARY', 'EMERGENCY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PenaltyType" AS ENUM ('WARNING', 'FINE', 'SUSPENSION', 'DEMOTION', 'DISMISSAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CellType" AS ENUM ('SINGLE', 'SHARED', 'HIGH_SECURITY', 'SOLITARY_CONFINEMENT', 'MEDICAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PrisonerStatus" AS ENUM ('REMAND', 'SENTENCED', 'PAROLE', 'ESCAPED', 'DECEASED', 'RELEASED', 'TRANSFERRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "OperationStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'STANDING_BY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PatrolStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_BREAK'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EmergencyCallStatus" AS ENUM ('RECEIVED', 'DISPATCHED', 'ON_SCENE', 'RESOLVED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TrafficViolationStatus" AS ENUM ('ISSUED', 'PAID', 'DISPUTED', 'DISMISSED', 'REFERRED_TO_COURT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- REMOVED: All DROP CONSTRAINT / DROP FOREIGN KEY (12 statements)
-- Removed: DROP TABLE AdminUser, District, Governorate, PoliceStation (4)
-- Removed: DROP COLUMN on Case, Department, Officer, User (9)
-- Removed: DROP COLUMN + re-add on Case.status, Case.priority (type change)
-- Reason: Destructive operations — cause permanent data loss
-- ============================================================================

-- ============================================================================
-- SAFE ALTER TABLE ADD COLUMN (nullable — relaxed from NOT NULL)
-- ============================================================================

-- Case: Add new columns (keep existing columns intact)
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "assignedOfficerId" TEXT;
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "hierarchyEntityId" TEXT;

-- Department: Keep existing policeStationId (original was DROP COLUMN)
-- Department already has policeStationId from init_rbac_system — preserve it

-- Officer: Add new columns (keep existing districtId, governorateId, policeStationId intact)
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "dateOfEnlistment" TIMESTAMP(3);
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "specialization" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "unitId" TEXT;

-- User: Add new columns (NULLABLE — relaxed from NOT NULL to prevent failure)
-- Keep existing districtId, governorateId, policeStationId intact
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "militaryNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rank" TEXT;
-- REMOVED: ALTER COLUMN "fullName" SET NOT NULL (may fail on NULL data)
-- REMOVED: ALTER COLUMN "department" SET NOT NULL (may fail on NULL data)

-- UserPermission: Add columns with defaults
ALTER TABLE "UserPermission" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "UserPermission" ADD COLUMN IF NOT EXISTS "granted" BOOLEAN DEFAULT true;

-- ============================================================================
-- TABLE CONFLICT RESOLUTION: WantedPerson (table already exists in production)
-- Original: CREATE TABLE "WantedPerson" (modern schema)
-- Refactored: ALTER TABLE ADD COLUMN for new columns only
-- Legacy columns preserved: id (SERIAL), fullName, identityNumber, nationality,
-- chargeDetails, issuingProvince, dangerLevel, status, createdAt
-- ============================================================================

ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "alias" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "identificationNumber" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "height" DOUBLE PRECISION;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "eyeColor" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "hairColor" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "distinguishingMarks" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "lastKnownLocation" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "riskLevel" TEXT DEFAULT 'MEDIUM';
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "wantedNumber" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "severity" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "domesticStatus" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "internationalNotice" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "lastSeenLocation" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "lastSeenDate" TIMESTAMP(3);
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN DEFAULT false;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "charges" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "physicalDescription" TEXT;
ALTER TABLE "WantedPerson" ADD COLUMN IF NOT EXISTS "idInt" INTEGER;

-- ============================================================================
-- SAFE CREATE TABLE (27 tables — all NEW, none conflict with production)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "HierarchyEntity" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "code" TEXT NOT NULL,
    "type" "HierarchyType" NOT NULL, "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HierarchyEntity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DynamicForm" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "code" TEXT,
    "hierarchyEntityId" TEXT NOT NULL, "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DynamicForm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DynamicField" (
    "id" TEXT NOT NULL, "formId" TEXT NOT NULL, "name" TEXT NOT NULL,
    "label" TEXT NOT NULL, "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false, "options" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0, "placeholder" TEXT,
    "validationRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DynamicField_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DynamicRecord" (
    "id" TEXT NOT NULL, "formId" TEXT NOT NULL, "data" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DynamicRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DynamicFile" (
    "id" TEXT NOT NULL, "recordId" TEXT NOT NULL, "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "fileSize" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DynamicFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ArchiveFolder" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
    "code" TEXT NOT NULL, "hierarchyEntityId" TEXT NOT NULL,
    "parentFolderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ArchiveFolder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ArchiveDocument" (
    "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
    "documentNumber" TEXT NOT NULL, "folderId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL, "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ArchiveDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentVersion" (
    "id" TEXT NOT NULL, "documentId" TEXT NOT NULL, "version" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL, "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL, "changes" TEXT, "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Incident" (
    "id" TEXT NOT NULL, "incidentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL, "description" TEXT,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "dateTime" TIMESTAMP(3) NOT NULL, "location" TEXT,
    "caseId" TEXT, "hierarchyEntityId" TEXT, "reportedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Section" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "code" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Unit" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "code" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Promotion" (
    "id" TEXT NOT NULL, "officerId" TEXT NOT NULL,
    "fromRank" TEXT NOT NULL, "toRank" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL, "orderNumber" TEXT NOT NULL,
    "reason" TEXT, "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Transfer" (
    "id" TEXT NOT NULL, "officerId" TEXT NOT NULL,
    "type" "TransferType" NOT NULL,
    "fromDepartment" TEXT, "toDepartment" TEXT,
    "fromUnit" TEXT, "toUnit" TEXT,
    "date" TIMESTAMP(3) NOT NULL, "orderNumber" TEXT NOT NULL,
    "reason" TEXT, "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Leave" (
    "id" TEXT NOT NULL, "officerId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT, "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Penalty" (
    "id" TEXT NOT NULL, "officerId" TEXT NOT NULL,
    "type" "PenaltyType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL, "reason" TEXT NOT NULL,
    "details" TEXT, "issuedBy" TEXT, "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WantedAttachment" (
    "id" TEXT NOT NULL, "wantedPersonId" INTEGER NOT NULL, -- تم التغيير إلى INTEGER
    "type" TEXT NOT NULL, "filePath" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WantedAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Circular" (
    "id" TEXT NOT NULL, "circularNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL, "description" TEXT,
    "type" TEXT NOT NULL, "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedDate" TIMESTAMP(3) NOT NULL, "expiryDate" TIMESTAMP(3),
    "issuingAuthority" TEXT NOT NULL, "wantedPersonId" INTEGER, -- تم التغيير إلى INTEGER
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Circular_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Prison" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "code" TEXT NOT NULL,
    "address" TEXT, "capacity" INTEGER NOT NULL,
    "currentPopulation" INTEGER NOT NULL DEFAULT 0,
    "securityLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prison_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Cell" (
    "id" TEXT NOT NULL, "cellNumber" TEXT NOT NULL,
    "prisonId" TEXT NOT NULL,
    "type" "CellType" NOT NULL DEFAULT 'SHARED',
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Prisoner" (
    "id" TEXT NOT NULL, "prisonerNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3), "gender" TEXT NOT NULL,
    "nationality" TEXT, "identificationNumber" TEXT,
    "photoUrl" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "expectedReleaseDate" TIMESTAMP(3),
    "status" "PrisonerStatus" NOT NULL DEFAULT 'REMAND',
    "crimeType" TEXT, "sentenceYears" INTEGER,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT, "prisonId" TEXT NOT NULL, "cellId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prisoner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Visit" (
    "id" TEXT NOT NULL, "prisonerId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL, "visitorIdNumber" TEXT,
    "relationship" TEXT, "visitDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT, "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Operation" (
    "id" TEXT NOT NULL, "operationNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL, "description" TEXT,
    "type" TEXT NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3),
    "location" TEXT, "hierarchyEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Patrol" (
    "id" TEXT NOT NULL, "patrolNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL, "type" TEXT NOT NULL,
    "status" "PatrolStatus" NOT NULL DEFAULT 'ACTIVE',
    "startTime" TIMESTAMP(3) NOT NULL, "endTime" TIMESTAMP(3),
    "route" JSONB, "assignedOfficers" TEXT[],
    "location" TEXT, "hierarchyEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Patrol_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmergencyCall" (
    "id" TEXT NOT NULL, "callNumber" TEXT NOT NULL,
    "callerName" TEXT NOT NULL, "callerPhone" TEXT NOT NULL,
    "location" TEXT NOT NULL, "description" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "status" "EmergencyCallStatus" NOT NULL DEFAULT 'RECEIVED',
    "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
    "dispatchedUnit" TEXT, "responseTime" INTEGER,
    "resolution" TEXT, "assignedOfficer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmergencyCall_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL, "plateNumber" TEXT NOT NULL,
    "chassisNumber" TEXT NOT NULL, "make" TEXT NOT NULL,
    "model" TEXT NOT NULL, "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL, "type" TEXT NOT NULL,
    "fuelType" TEXT, "engineCapacity" INTEGER,
    "ownerName" TEXT NOT NULL, "ownerIdNumber" TEXT,
    "ownerPhone" TEXT, "ownerAddress" TEXT,
    "registrationDate" TIMESTAMP(3), "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE', "insuranceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DrivingLicense" (
    "id" TEXT NOT NULL, "licenseNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL, "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL, "idNumber" TEXT NOT NULL,
    "address" TEXT, "phone" TEXT,
    "licenseType" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL, "expiryDate" TIMESTAMP(3) NOT NULL,
    "bloodType" TEXT, "restrictions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE', "issuingAuthority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DrivingLicense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrafficViolation" (
    "id" TEXT NOT NULL, "violationNumber" TEXT NOT NULL,
    "vehicleId" TEXT, "driverName" TEXT NOT NULL,
    "driverLicense" TEXT, "violationType" TEXT NOT NULL,
    "location" TEXT NOT NULL, "dateTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT, "fineAmount" DOUBLE PRECISION NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "status" "TrafficViolationStatus" NOT NULL DEFAULT 'ISSUED',
    "paidAmount" DOUBLE PRECISION, "paidDate" TIMESTAMP(3),
    "officerBadge" TEXT, "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrafficViolation_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- INDEXES (all with IF NOT EXISTS guards)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "HierarchyEntity_code_key" ON "HierarchyEntity"("code");
CREATE INDEX IF NOT EXISTS "HierarchyEntity_parentId_idx" ON "HierarchyEntity"("parentId");
CREATE INDEX IF NOT EXISTS "HierarchyEntity_type_idx" ON "HierarchyEntity"("type");
CREATE INDEX IF NOT EXISTS "DynamicForm_hierarchyEntityId_idx" ON "DynamicForm"("hierarchyEntityId");
CREATE INDEX IF NOT EXISTS "DynamicField_formId_idx" ON "DynamicField"("formId");
CREATE INDEX IF NOT EXISTS "DynamicRecord_formId_idx" ON "DynamicRecord"("formId");
CREATE INDEX IF NOT EXISTS "DynamicFile_recordId_idx" ON "DynamicFile"("recordId");
CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveFolder_code_key" ON "ArchiveFolder"("code");
CREATE INDEX IF NOT EXISTS "ArchiveFolder_hierarchyEntityId_idx" ON "ArchiveFolder"("hierarchyEntityId");
CREATE INDEX IF NOT EXISTS "ArchiveFolder_parentFolderId_idx" ON "ArchiveFolder"("parentFolderId");
CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveDocument_documentNumber_key" ON "ArchiveDocument"("documentNumber");
CREATE INDEX IF NOT EXISTS "ArchiveDocument_folderId_idx" ON "ArchiveDocument"("folderId");
CREATE INDEX IF NOT EXISTS "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "Incident_incidentNumber_key" ON "Incident"("incidentNumber");
CREATE INDEX IF NOT EXISTS "Incident_caseId_idx" ON "Incident"("caseId");
CREATE INDEX IF NOT EXISTS "Incident_hierarchyEntityId_idx" ON "Incident"("hierarchyEntityId");
CREATE INDEX IF NOT EXISTS "Incident_status_idx" ON "Incident"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Section_code_key" ON "Section"("code");
CREATE INDEX IF NOT EXISTS "Section_departmentId_idx" ON "Section"("departmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Unit_code_key" ON "Unit"("code");
CREATE INDEX IF NOT EXISTS "Unit_sectionId_idx" ON "Unit"("sectionId");
CREATE INDEX IF NOT EXISTS "Promotion_officerId_idx" ON "Promotion"("officerId");
CREATE INDEX IF NOT EXISTS "Transfer_officerId_idx" ON "Transfer"("officerId");
CREATE INDEX IF NOT EXISTS "Leave_officerId_idx" ON "Leave"("officerId");
CREATE INDEX IF NOT EXISTS "Penalty_officerId_idx" ON "Penalty"("officerId");
CREATE INDEX IF NOT EXISTS "WantedPerson_status_idx" ON "WantedPerson"("status");
CREATE INDEX IF NOT EXISTS "WantedPerson_firstName_lastName_idx" ON "WantedPerson"("firstName", "lastName");
CREATE INDEX IF NOT EXISTS "WantedAttachment_wantedPersonId_idx" ON "WantedAttachment"("wantedPersonId");
CREATE UNIQUE INDEX IF NOT EXISTS "Circular_circularNumber_key" ON "Circular"("circularNumber");
CREATE INDEX IF NOT EXISTS "Circular_status_idx" ON "Circular"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Prison_code_key" ON "Prison"("code");
CREATE INDEX IF NOT EXISTS "Cell_prisonId_idx" ON "Cell"("prisonId");
CREATE UNIQUE INDEX IF NOT EXISTS "Cell_cellNumber_prisonId_key" ON "Cell"("cellNumber", "prisonId");
CREATE UNIQUE INDEX IF NOT EXISTS "Prisoner_prisonerNumber_key" ON "Prisoner"("prisonerNumber");
CREATE INDEX IF NOT EXISTS "Prisoner_prisonId_idx" ON "Prisoner"("prisonId");
CREATE INDEX IF NOT EXISTS "Prisoner_cellId_idx" ON "Prisoner"("cellId");
CREATE INDEX IF NOT EXISTS "Prisoner_status_idx" ON "Prisoner"("status");
CREATE INDEX IF NOT EXISTS "Visit_prisonerId_idx" ON "Visit"("prisonerId");
CREATE INDEX IF NOT EXISTS "Visit_visitDate_idx" ON "Visit"("visitDate");
CREATE UNIQUE INDEX IF NOT EXISTS "Operation_operationNumber_key" ON "Operation"("operationNumber");
CREATE INDEX IF NOT EXISTS "Operation_hierarchyEntityId_idx" ON "Operation"("hierarchyEntityId");
CREATE INDEX IF NOT EXISTS "Operation_status_idx" ON "Operation"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Patrol_patrolNumber_key" ON "Patrol"("patrolNumber");
CREATE INDEX IF NOT EXISTS "Patrol_hierarchyEntityId_idx" ON "Patrol"("hierarchyEntityId");
CREATE INDEX IF NOT EXISTS "Patrol_status_idx" ON "Patrol"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "EmergencyCall_callNumber_key" ON "EmergencyCall"("callNumber");
CREATE INDEX IF NOT EXISTS "EmergencyCall_status_idx" ON "EmergencyCall"("status");
CREATE INDEX IF NOT EXISTS "EmergencyCall_priority_idx" ON "EmergencyCall"("priority");
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_chassisNumber_key" ON "Vehicle"("chassisNumber");
CREATE INDEX IF NOT EXISTS "Vehicle_ownerName_idx" ON "Vehicle"("ownerName");
CREATE UNIQUE INDEX IF NOT EXISTS "DrivingLicense_licenseNumber_key" ON "DrivingLicense"("licenseNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "DrivingLicense_idNumber_key" ON "DrivingLicense"("idNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "TrafficViolation_violationNumber_key" ON "TrafficViolation"("violationNumber");
CREATE INDEX IF NOT EXISTS "TrafficViolation_vehicleId_idx" ON "TrafficViolation"("vehicleId");
CREATE INDEX IF NOT EXISTS "TrafficViolation_status_idx" ON "TrafficViolation"("status");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_officerId_idx" ON "AuditLog"("officerId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "Case_hierarchyEntityId_idx" ON "Case"("hierarchyEntityId");
CREATE INDEX IF NOT EXISTS "Case_status_idx" ON "Case"("status");
CREATE INDEX IF NOT EXISTS "Case_priority_idx" ON "Case"("priority");
CREATE INDEX IF NOT EXISTS "Officer_departmentId_idx" ON "Officer"("departmentId");
CREATE INDEX IF NOT EXISTS "Officer_unitId_idx" ON "Officer"("unitId");
CREATE INDEX IF NOT EXISTS "Officer_isActive_idx" ON "Officer"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "User_militaryNumber_key" ON "User"("militaryNumber");

-- ============================================================================
-- FOREIGN KEYS (all with duplicate_object guard)
-- ============================================================================

DO $$ BEGIN ALTER TABLE "HierarchyEntity" ADD CONSTRAINT "HierarchyEntity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DynamicForm" ADD CONSTRAINT "DynamicForm_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DynamicField" ADD CONSTRAINT "DynamicField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "DynamicForm"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DynamicRecord" ADD CONSTRAINT "DynamicRecord_formId_fkey" FOREIGN KEY ("formId") REFERENCES "DynamicForm"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DynamicRecord" ADD CONSTRAINT "DynamicRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DynamicFile" ADD CONSTRAINT "DynamicFile_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "DynamicRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ArchiveFolder" ADD CONSTRAINT "ArchiveFolder_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ArchiveFolder" ADD CONSTRAINT "ArchiveFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "ArchiveFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ArchiveDocument" ADD CONSTRAINT "ArchiveDocument_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ArchiveFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ArchiveDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Case" ADD CONSTRAINT "Case_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Incident" ADD CONSTRAINT "Incident_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Incident" ADD CONSTRAINT "Incident_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Section" ADD CONSTRAINT "Section_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Unit" ADD CONSTRAINT "Unit_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Officer" ADD CONSTRAINT "Officer_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Leave" ADD CONSTRAINT "Leave_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "WantedAttachment" ADD CONSTRAINT "WantedAttachment_wantedPersonId_fkey" FOREIGN KEY ("wantedPersonId") REFERENCES "WantedPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Cell" ADD CONSTRAINT "Cell_prisonId_fkey" FOREIGN KEY ("prisonId") REFERENCES "Prison"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Prisoner" ADD CONSTRAINT "Prisoner_prisonId_fkey" FOREIGN KEY ("prisonId") REFERENCES "Prison"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Prisoner" ADD CONSTRAINT "Prisoner_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "Cell"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Visit" ADD CONSTRAINT "Visit_prisonerId_fkey" FOREIGN KEY ("prisonerId") REFERENCES "Prisoner"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Operation" ADD CONSTRAINT "Operation_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Patrol" ADD CONSTRAINT "Patrol_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TrafficViolation" ADD CONSTRAINT "TrafficViolation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;