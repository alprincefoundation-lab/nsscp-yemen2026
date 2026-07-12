-- ============================================================================
-- REFACTORED: 20260623134559_init_rbac_system
-- Original purpose: Initialize RBAC system + basic security domain
-- Refactored: 2026-07-10 — Production-safe version
--
-- Changes from original:
--   ✅ AuditLog CREATE TABLE → ALTER TABLE ADD COLUMN (table already exists)
--   ✅ Officer CREATE TABLE → ALTER TABLE ADD COLUMN (table already exists)
--   ✅ Enum creation wrapped with existence check
--   ✅ All 12 other CREATE TABLE kept as-is (no conflicts)
--   ✅ DESTRUCTIVE operations removed: 0
-- ============================================================================

-- CreateEnum (with existence check)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MINISTRY_ADMIN', 'GOVERNORATE_ADMIN', 'DISTRICT_ADMIN', 'POLICE_ADMIN', 'OFFICER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SAFE CREATE TABLE (12 tables — none exist in production)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "department" TEXT,
    "phoneNumber" TEXT,
    "avatar" TEXT,
    "governorateId" TEXT,
    "districtId" TEXT,
    "policeStationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" "UserRole" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

CREATE TABLE IF NOT EXISTS "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "roleId" TEXT,
    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Governorate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Governorate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "governorateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PoliceStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "governorateId" TEXT NOT NULL,
    "districtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PoliceStation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Case" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "caseType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "governorateId" TEXT,
    "districtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CaseAssignment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'investigator',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "policeStationId" TEXT,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- TABLE CONFLICT RESOLUTION: AuditLog (table already exists in production)
-- Original: CREATE TABLE "AuditLog"
-- Refactored: ALTER TABLE ADD COLUMN for new columns only
-- The existing columns (id, action, entityType, entityId, officerId, details,
-- ipAddress, userAgent, createdAt) are PRESERVED from the Legacy schema.
-- ============================================================================

ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "hierarchyEntityId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "hierarchyEntityType" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- ============================================================================
-- TABLE CONFLICT RESOLUTION: Officer (table already exists in production)
-- Original: CREATE TABLE "Officer"
-- Refactored: ALTER TABLE ADD COLUMN for new columns only
-- The existing columns (id, name, rank, role, department, accessLevel,
-- createdAt, updatedAt) are PRESERVED from the Legacy schema.
-- ============================================================================

ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "fullName" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "badgeNumber" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "governorateId" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "districtId" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "policeStationId" TEXT;
ALTER TABLE "Officer" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;

-- ============================================================================
-- INDEXES (all with IF NOT EXISTS guards)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_username_key" ON "AdminUser"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_name_key" ON "Permission"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");
CREATE UNIQUE INDEX IF NOT EXISTS "Governorate_code_key" ON "Governorate"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "District_code_key" ON "District"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "PoliceStation_code_key" ON "PoliceStation"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Officer_badgeNumber_key" ON "Officer"("badgeNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Officer_userId_key" ON "Officer"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Case_caseNumber_key" ON "Case"("caseNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "CaseAssignment_caseId_officerId_key" ON "CaseAssignment"("caseId", "officerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Department_code_key" ON "Department"("code");

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "District" ADD CONSTRAINT "District_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Officer" ADD CONSTRAINT "Officer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Officer" ADD CONSTRAINT "Officer_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Officer" ADD CONSTRAINT "Officer_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Officer" ADD CONSTRAINT "Officer_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Officer" ADD CONSTRAINT "Officer_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Case" ADD CONSTRAINT "Case_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Case" ADD CONSTRAINT "Case_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Department" ADD CONSTRAINT "Department_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;