-- ============================================================================
-- Migration: 20260523212212_add_hierarchy_system
-- Restored from introspected schema via prisma db pull
-- This is the original migration applied to the production database
-- ============================================================================

-- CentralCommand
CREATE TABLE "CentralCommand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CentralCommand_pkey" PRIMARY KEY ("id")
);

-- Province
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "centralCommandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- Level3Unit
CREATE TABLE "Level3Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Level3Unit_pkey" PRIMARY KEY ("id")
);

-- Level4Department
CREATE TABLE "Level4Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentType" TEXT NOT NULL,
    "level3UnitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Level4Department_pkey" PRIMARY KEY ("id")
);

-- Level5Section
CREATE TABLE "Level5Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "level4DepartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Level5Section_pkey" PRIMARY KEY ("id")
);

-- Level6Unit
CREATE TABLE "Level6Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "level5SectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Level6Unit_pkey" PRIMARY KEY ("id")
);

-- Officer
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "accessLevel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- LevelAssignment
CREATE TABLE "LevelAssignment" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LevelAssignment_pkey" PRIMARY KEY ("id")
);

-- DataRecord
CREATE TABLE "DataRecord" (
    "id" TEXT NOT NULL,
    "level6UnitId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "securityLevel" TEXT NOT NULL DEFAULT 'internal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DataRecord_pkey" PRIMARY KEY ("id")
);

-- Facility
CREATE TABLE "Facility" (
    "id" SERIAL NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "facilityType" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phoneNumber" TEXT,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- MovementReport
CREATE TABLE "MovementReport" (
    "id" SERIAL NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestIdentity" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomOrSection" TEXT,
    "recordedBy" TEXT NOT NULL,
    CONSTRAINT "MovementReport_pkey" PRIMARY KEY ("id")
);

-- WantedPerson
CREATE TABLE "WantedPerson" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "identityNumber" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'يمني',
    "chargeDetails" TEXT,
    "issuingProvince" TEXT NOT NULL,
    "dangerLevel" TEXT NOT NULL DEFAULT 'عالي جداً',
    "status" TEXT NOT NULL DEFAULT 'مطلوب حياً',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WantedPerson_pkey" PRIMARY KEY ("id")
);

-- SystemNotification
CREATE TABLE "SystemNotification" (
    "id" SERIAL NOT NULL,
    "alertType" TEXT NOT NULL DEFAULT 'إشعار أحمر - خطير',
    "wantedId" INTEGER,
    "reportId" INTEGER,
    "detectProvince" TEXT NOT NULL,
    "detectFacility" TEXT NOT NULL,
    "targetProvince" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "alertTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemNotification_pkey" PRIMARY KEY ("id")
);

-- Report
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "officerId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "centralCommandId" TEXT,
    "provinceId" TEXT,
    "level3UnitId" TEXT,
    "level4DepartmentId" TEXT,
    "level5SectionId" TEXT,
    "level6UnitId" TEXT,
    "dataRecordId" TEXT,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "Province" ADD CONSTRAINT "Province_centralCommandId_fkey" FOREIGN KEY ("centralCommandId") REFERENCES "CentralCommand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Level3Unit" ADD CONSTRAINT "Level3Unit_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Level4Department" ADD CONSTRAINT "Level4Department_level3UnitId_fkey" FOREIGN KEY ("level3UnitId") REFERENCES "Level3Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Level5Section" ADD CONSTRAINT "Level5Section_level4DepartmentId_fkey" FOREIGN KEY ("level4DepartmentId") REFERENCES "Level4Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Level6Unit" ADD CONSTRAINT "Level6Unit_level5SectionId_fkey" FOREIGN KEY ("level5SectionId") REFERENCES "Level5Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LevelAssignment" ADD CONSTRAINT "LevelAssignment_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DataRecord" ADD CONSTRAINT "DataRecord_level6UnitId_fkey" FOREIGN KEY ("level6UnitId") REFERENCES "Level6Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovementReport" ADD CONSTRAINT "MovementReport_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SystemNotification" ADD CONSTRAINT "SystemNotification_wantedId_fkey" FOREIGN KEY ("wantedId") REFERENCES "WantedPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SystemNotification" ADD CONSTRAINT "SystemNotification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MovementReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unique constraints
CREATE UNIQUE INDEX "CentralCommand_code_key" ON "CentralCommand"("code");
CREATE UNIQUE INDEX "Province_code_key" ON "Province"("code");
CREATE UNIQUE INDEX "Level3Unit_code_key" ON "Level3Unit"("code");
CREATE UNIQUE INDEX "Level4Department_code_key" ON "Level4Department"("code");
CREATE UNIQUE INDEX "Level5Section_code_key" ON "Level5Section"("code");
CREATE UNIQUE INDEX "Level6Unit_code_key" ON "Level6Unit"("code");
CREATE UNIQUE INDEX "LevelAssignment_officerId_level_unitId_key" ON "LevelAssignment"("officerId", "level", "unitId");
CREATE UNIQUE INDEX "WantedPerson_identityNumber_key" ON "WantedPerson"("identityNumber");