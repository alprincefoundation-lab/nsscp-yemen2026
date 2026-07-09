-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MINISTRY_ADMIN', 'GOVERNORATE_ADMIN', 'DISTRICT_ADMIN', 'POLICE_ADMIN', 'OFFICER', 'VIEWER');

-- CreateEnum
CREATE TYPE "HierarchyType" AS ENUM ('MINISTRY', 'GOVERNORATE', 'DEPARTMENT', 'SECTION', 'UNIT');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'TEXTAREA', 'FILE', 'IMAGE');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'PENDING_REVIEW', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('THEFT', 'ASSAULT', 'TRAFFIC_ACCIDENT', 'DOMESTIC_VIOLENCE', 'NARCOTICS', 'FRAUD', 'HOMICIDE', 'PUBLIC_DISTURBANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('REPORTED', 'UNDER_INVESTIGATION', 'RESOLVED', 'UNFOUNDED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CellType" AS ENUM ('SINGLE', 'SHARED', 'HIGH_SECURITY', 'SOLITARY_CONFINEMENT', 'MEDICAL');

-- CreateEnum
CREATE TYPE "PrisonerStatus" AS ENUM ('REMAND', 'SENTENCED', 'PAROLE', 'ESCAPED', 'DECEASED', 'RELEASED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'STANDING_BY');

-- CreateEnum
CREATE TYPE "PatrolStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_BREAK');

-- CreateEnum
CREATE TYPE "EmergencyCallStatus" AS ENUM ('RECEIVED', 'DISPATCHED', 'ON_SCENE', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrafficViolationStatus" AS ENUM ('ISSUED', 'PAID', 'DISPUTED', 'DISMISSED', 'REFERRED_TO_COURT');

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_centralCommandId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_dataRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_level3UnitId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_level4DepartmentId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_level5SectionId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_level6UnitId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_officerId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_provinceId_fkey";

-- DropForeignKey
ALTER TABLE "DataRecord" DROP CONSTRAINT "DataRecord_level6UnitId_fkey";

-- DropForeignKey
ALTER TABLE "Level3Unit" DROP CONSTRAINT "Level3Unit_provinceId_fkey";

-- DropForeignKey
ALTER TABLE "Level4Department" DROP CONSTRAINT "Level4Department_level3UnitId_fkey";

-- DropForeignKey
ALTER TABLE "Level5Section" DROP CONSTRAINT "Level5Section_level4DepartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Level6Unit" DROP CONSTRAINT "Level6Unit_level5SectionId_fkey";

-- DropForeignKey
ALTER TABLE "LevelAssignment" DROP CONSTRAINT "LevelAssignment_officerId_fkey";

-- DropForeignKey
ALTER TABLE "MovementReport" DROP CONSTRAINT "MovementReport_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "Province" DROP CONSTRAINT "Province_centralCommandId_fkey";

-- DropForeignKey
ALTER TABLE "SystemNotification" DROP CONSTRAINT "SystemNotification_reportId_fkey";

-- DropForeignKey
ALTER TABLE "SystemNotification" DROP CONSTRAINT "SystemNotification_wantedId_fkey";

-- DropIndex
DROP INDEX "WantedPerson_identityNumber_key";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "centralCommandId",
DROP COLUMN "createdAt",
DROP COLUMN "dataRecordId",
DROP COLUMN "details",
DROP COLUMN "entityId",
DROP COLUMN "entityType",
DROP COLUMN "level3UnitId",
DROP COLUMN "level4DepartmentId",
DROP COLUMN "level5SectionId",
DROP COLUMN "level6UnitId",
DROP COLUMN "officerId",
DROP COLUMN "provinceId",
ADD COLUMN     "newValue" JSONB,
ADD COLUMN     "oldValue" JSONB,
ADD COLUMN     "resource" TEXT NOT NULL,
ADD COLUMN     "resourceId" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "WantedPerson" DROP CONSTRAINT "WantedPerson_pkey",
DROP COLUMN "chargeDetails",
DROP COLUMN "dangerLevel",
DROP COLUMN "fullName",
DROP COLUMN "identityNumber",
DROP COLUMN "issuingProvince",
DROP COLUMN "nationality",
DROP COLUMN "status",
ADD COLUMN     "aliases" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "WantedPerson_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "WantedPerson_id_seq";

-- DropTable
DROP TABLE "CentralCommand";

-- DropTable
DROP TABLE "DataRecord";

-- DropTable
DROP TABLE "Facility";

-- DropTable
DROP TABLE "Level3Unit";

-- DropTable
DROP TABLE "Level4Department";

-- DropTable
DROP TABLE "Level5Section";

-- DropTable
DROP TABLE "Level6Unit";

-- DropTable
DROP TABLE "LevelAssignment";

-- DropTable
DROP TABLE "MovementReport";

-- DropTable
DROP TABLE "Officer";

-- DropTable
DROP TABLE "Province";

-- DropTable
DROP TABLE "Report";

-- DropTable
DROP TABLE "SystemNotification";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT,
    "nationalId" TEXT,
    "militaryId" TEXT,
    "roleId" TEXT,
    "departmentId" TEXT,
    "governorateId" TEXT,
    "stationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hierarchyEntityId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Governorate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Governorate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "governorateId" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "governorateId" TEXT,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HierarchyEntity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "HierarchyType" NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "HierarchyEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HierarchyUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HierarchyUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dynamicFormId" TEXT,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "submittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormAttachment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "FormAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSignature" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,

    CONSTRAINT "FormSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormApproval" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "FormApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "ArchiveFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "folderId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiveDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionIndex" INTEGER NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CasePriority",
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "leadId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "description" TEXT,
    "storedAt" TEXT,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrimeScene" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "CrimeScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationTimeline" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "operationId" TEXT,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentTimeline" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suspect" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Suspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Witness" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Witness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interrogation" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Interrogation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationTimeline" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestigationTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowState" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "WorkflowState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowApproval" (
    "id" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEscalation" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,

    CONSTRAINT "WorkflowEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransitionLog" (
    "id" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTransitionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prisoner" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT,
    "status" "PrisonerStatus" NOT NULL,
    "admittedAt" TIMESTAMP(3),

    CONSTRAINT "Prisoner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CellType" NOT NULL,
    "capacity" INTEGER,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinaryRecord" (
    "id" TEXT NOT NULL,
    "prisonerId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "DisciplinaryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "prisonerId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorLog" (
    "id" TEXT NOT NULL,
    "prisonerId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_UserPermissions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nationalId_key" ON "User"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "User_militaryId_key" ON "User"("militaryId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Governorate_code_key" ON "Governorate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "District_code_key" ON "District"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HierarchyEntity_code_key" ON "HierarchyEntity"("code");

-- CreateIndex
CREATE UNIQUE INDEX "_UserRoles_AB_unique" ON "_UserRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_UserRoles_B_index" ON "_UserRoles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UserPermissions_AB_unique" ON "_UserPermissions"("A", "B");

-- CreateIndex
CREATE INDEX "_UserPermissions_B_index" ON "_UserPermissions"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HierarchyEntity" ADD CONSTRAINT "HierarchyEntity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HierarchyUser" ADD CONSTRAINT "HierarchyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HierarchyUser" ADD CONSTRAINT "HierarchyUser_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "HierarchyEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_dynamicFormId_fkey" FOREIGN KEY ("dynamicFormId") REFERENCES "DynamicForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserRoles" ADD CONSTRAINT "_UserRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserRoles" ADD CONSTRAINT "_UserRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPermissions" ADD CONSTRAINT "_UserPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPermissions" ADD CONSTRAINT "_UserPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
