-- ============================================================================
-- Migration: 20260710_phase_b_missing_17_models
-- Purpose: Create 17 missing models identified by schema-database-code reconciliation
-- Safety: All CREATE TABLE IF NOT EXISTS — fully additive, idempotent
-- Date: 2026-07-10
-- ============================================================================

-- HierarchyUser (hierarchy user assignments)
CREATE TABLE IF NOT EXISTS "HierarchyUser" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "entityId"   TEXT NOT NULL,
    "isPrimary"  BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HierarchyUser_pkey" PRIMARY KEY ("id")
);

-- Complaint (case complaints)
CREATE TABLE IF NOT EXISTS "Complaint" (
    "id"               TEXT NOT NULL,
    "complaintType"    TEXT NOT NULL,
    "category"         TEXT NOT NULL,
    "description"      TEXT NOT NULL,
    "severity"         TEXT NOT NULL DEFAULT 'MEDIUM',
    "complainantName"  TEXT NOT NULL,
    "complainantPhone" TEXT,
    "complainantEmail" TEXT,
    "caseId"           TEXT NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- Investigation (case investigations)
CREATE TABLE IF NOT EXISTS "Investigation" (
    "id"           TEXT NOT NULL,
    "caseId"       TEXT NOT NULL,
    "assignedTo"   TEXT,
    "leadId"       TEXT,
    "type"         TEXT,
    "priority"     TEXT NOT NULL DEFAULT 'MEDIUM',
    "description"  TEXT,
    "departmentId" TEXT,
    "status"       TEXT NOT NULL DEFAULT 'ACTIVE',
    "findings"     TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- Evidence (case/investigation evidence)
CREATE TABLE IF NOT EXISTS "Evidence" (
    "id"               TEXT NOT NULL,
    "caseId"           TEXT,
    "investigationId"  TEXT,
    "type"             TEXT,
    "description"      TEXT,
    "collectedBy"      TEXT,
    "collectedAt"      TIMESTAMP(3),
    "location"         TEXT,
    "handler"          TEXT,
    "storageLocation"  TEXT,
    "storedAt"         TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- Suspect (investigation suspects)
CREATE TABLE IF NOT EXISTS "Suspect" (
    "id"              TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "identityNumber"  TEXT,
    "birthDate"       TIMESTAMP(3),
    "gender"          TEXT,
    "address"         TEXT,
    "phoneNumber"     TEXT,
    "status"          TEXT NOT NULL DEFAULT 'PERSON_OF_INTEREST',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Suspect_pkey" PRIMARY KEY ("id")
);

-- Witness (investigation witnesses)
CREATE TABLE IF NOT EXISTS "Witness" (
    "id"              TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "identityNumber"  TEXT,
    "birthDate"       TIMESTAMP(3),
    "gender"          TEXT,
    "address"         TEXT,
    "phoneNumber"     TEXT,
    "email"           TEXT,
    "statement"       TEXT,
    "statementDate"   TIMESTAMP(3),
    "reliability"     TEXT NOT NULL DEFAULT 'UNKNOWN',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Witness_pkey" PRIMARY KEY ("id")
);

-- Interrogation (suspect interrogations)
CREATE TABLE IF NOT EXISTS "Interrogation" (
    "id"              TEXT NOT NULL,
    "suspectId"       TEXT NOT NULL,
    "investigationId" TEXT,
    "interrogatorId"  TEXT,
    "date"            TIMESTAMP(3) NOT NULL,
    "location"        TEXT,
    "duration"        INTEGER,
    "statement"       TEXT,
    "notes"           TEXT,
    "outcome"         TEXT NOT NULL DEFAULT 'ONGOING',
    "recordingUrl"    TEXT,
    "transcriptUrl"   TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Interrogation_pkey" PRIMARY KEY ("id")
);

-- InvestigationTimeline
CREATE TABLE IF NOT EXISTS "InvestigationTimeline" (
    "id"              TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "eventType"       TEXT,
    "description"     TEXT,
    "note"            TEXT,
    "location"        TEXT,
    "createdBy"       TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestigationTimeline_pkey" PRIMARY KEY ("id")
);

-- IncidentTimeline
CREATE TABLE IF NOT EXISTS "IncidentTimeline" (
    "id"          TEXT NOT NULL,
    "incidentId"  TEXT NOT NULL,
    "eventType"   TEXT,
    "description" TEXT,
    "note"        TEXT,
    "createdBy"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncidentTimeline_pkey" PRIMARY KEY ("id")
);

-- OperationTimeline
CREATE TABLE IF NOT EXISTS "OperationTimeline" (
    "id"          TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "eventType"   TEXT,
    "description" TEXT,
    "note"        TEXT,
    "location"    TEXT,
    "createdBy"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationTimeline_pkey" PRIMARY KEY ("id")
);

-- DisciplinaryRecord (prison disciplinary)
CREATE TABLE IF NOT EXISTS "DisciplinaryRecord" (
    "id"            TEXT NOT NULL,
    "prisonerId"    TEXT NOT NULL,
    "violationType" TEXT,
    "description"   TEXT,
    "notes"         TEXT,
    "severity"      TEXT,
    "actionTaken"   TEXT,
    "recordedBy"    TEXT,
    "recordDate"    TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DisciplinaryRecord_pkey" PRIMARY KEY ("id")
);

-- MedicalRecord (prison medical)
CREATE TABLE IF NOT EXISTS "MedicalRecord" (
    "id"               TEXT NOT NULL,
    "prisonerId"       TEXT NOT NULL,
    "description"      TEXT,
    "notes"            TEXT,
    "medicalStaff"     TEXT,
    "treatment"        TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "examinationDate"  TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- VisitorLog (prison visitor logs)
CREATE TABLE IF NOT EXISTS "VisitorLog" (
    "id"              TEXT NOT NULL,
    "prisonerId"      TEXT NOT NULL,
    "visitorName"     TEXT NOT NULL,
    "visitorRelation" TEXT,
    "visitDate"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitedAt"       TIMESTAMP(3),
    "duration"        INTEGER,
    "purpose"         TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

-- FormSubmission (dynamic form submissions)
CREATE TABLE IF NOT EXISTS "FormSubmission" (
    "id"          TEXT NOT NULL,
    "templateId"  TEXT NOT NULL,
    "data"        JSONB NOT NULL,
    "submittedBy" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- WorkflowState
CREATE TABLE IF NOT EXISTS "WorkflowState" (
    "id"   TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "WorkflowState_pkey" PRIMARY KEY ("id")
);

-- WorkflowTransition
CREATE TABLE IF NOT EXISTS "WorkflowTransition" (
    "id"        TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState"   TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- WorkflowApproval
CREATE TABLE IF NOT EXISTS "WorkflowApproval" (
    "id"         TEXT NOT NULL,
    "refId"      TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status"     TEXT NOT NULL,
    CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS "HierarchyUser_userId_idx" ON "HierarchyUser"("userId");
CREATE INDEX IF NOT EXISTS "HierarchyUser_entityId_idx" ON "HierarchyUser"("entityId");

CREATE INDEX IF NOT EXISTS "Complaint_caseId_idx" ON "Complaint"("caseId");

CREATE INDEX IF NOT EXISTS "Investigation_caseId_idx" ON "Investigation"("caseId");
CREATE INDEX IF NOT EXISTS "Investigation_assignedTo_idx" ON "Investigation"("assignedTo");

CREATE INDEX IF NOT EXISTS "Evidence_caseId_idx" ON "Evidence"("caseId");
CREATE INDEX IF NOT EXISTS "Evidence_investigationId_idx" ON "Evidence"("investigationId");

CREATE INDEX IF NOT EXISTS "Suspect_investigationId_idx" ON "Suspect"("investigationId");

CREATE INDEX IF NOT EXISTS "Witness_investigationId_idx" ON "Witness"("investigationId");

CREATE INDEX IF NOT EXISTS "Interrogation_suspectId_idx" ON "Interrogation"("suspectId");
CREATE INDEX IF NOT EXISTS "Interrogation_investigationId_idx" ON "Interrogation"("investigationId");
CREATE INDEX IF NOT EXISTS "Interrogation_interrogatorId_idx" ON "Interrogation"("interrogatorId");

CREATE INDEX IF NOT EXISTS "InvestigationTimeline_investigationId_idx" ON "InvestigationTimeline"("investigationId");

CREATE INDEX IF NOT EXISTS "IncidentTimeline_incidentId_idx" ON "IncidentTimeline"("incidentId");

CREATE INDEX IF NOT EXISTS "OperationTimeline_operationId_idx" ON "OperationTimeline"("operationId");

CREATE INDEX IF NOT EXISTS "DisciplinaryRecord_prisonerId_idx" ON "DisciplinaryRecord"("prisonerId");
CREATE INDEX IF NOT EXISTS "MedicalRecord_prisonerId_idx" ON "MedicalRecord"("prisonerId");
CREATE INDEX IF NOT EXISTS "VisitorLog_prisonerId_idx" ON "VisitorLog"("prisonerId");

CREATE INDEX IF NOT EXISTS "FormSubmission_templateId_idx" ON "FormSubmission"("templateId");

-- ============================================================================
-- FOREIGN KEYS (all with duplicate_object guard)
-- ============================================================================

DO $$ BEGIN
    ALTER TABLE "HierarchyUser" ADD CONSTRAINT "HierarchyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "HierarchyUser" ADD CONSTRAINT "HierarchyUser_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "HierarchyEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Suspect" ADD CONSTRAINT "Suspect_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Witness" ADD CONSTRAINT "Witness_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Interrogation" ADD CONSTRAINT "Interrogation_suspectId_fkey" FOREIGN KEY ("suspectId") REFERENCES "Suspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Interrogation" ADD CONSTRAINT "Interrogation_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Interrogation" ADD CONSTRAINT "Interrogation_interrogatorId_fkey" FOREIGN KEY ("interrogatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "InvestigationTimeline" ADD CONSTRAINT "InvestigationTimeline_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "OperationTimeline" ADD CONSTRAINT "OperationTimeline_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "DisciplinaryRecord" ADD CONSTRAINT "DisciplinaryRecord_prisonerId_fkey" FOREIGN KEY ("prisonerId") REFERENCES "Prisoner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_prisonerId_fkey" FOREIGN KEY ("prisonerId") REFERENCES "Prisoner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_prisonerId_fkey" FOREIGN KEY ("prisonerId") REFERENCES "Prisoner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;