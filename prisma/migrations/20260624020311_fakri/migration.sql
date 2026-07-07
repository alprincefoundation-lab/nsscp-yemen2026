/*
  Warnings:

  - You are about to drop the column `districtId` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `governorateId` on the `Case` table. All the data in the column will be lost.
  - The `status` column on the `Case` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `Case` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `policeStationId` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `districtId` on the `Officer` table. All the data in the column will be lost.
  - You are about to drop the column `governorateId` on the `Officer` table. All the data in the column will be lost.
  - You are about to drop the column `policeStationId` on the `Officer` table. All the data in the column will be lost.
  - You are about to drop the column `districtId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `governorateId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `policeStationId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AdminUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `District` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Governorate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PoliceStation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[militaryNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `militaryNumber` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rank` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `fullName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `department` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
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
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'UNPAID', 'TRAINING');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('PROMOTIONAL', 'ROTATIONAL', 'DISCIPLINARY', 'VOLUNTARY', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('WARNING', 'FINE', 'SUSPENSION', 'DEMOTION', 'DISMISSAL');

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
ALTER TABLE "Case" DROP CONSTRAINT "Case_districtId_fkey";

-- DropForeignKey
ALTER TABLE "Case" DROP CONSTRAINT "Case_governorateId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_policeStationId_fkey";

-- DropForeignKey
ALTER TABLE "District" DROP CONSTRAINT "District_governorateId_fkey";

-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_districtId_fkey";

-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_governorateId_fkey";

-- DropForeignKey
ALTER TABLE "Officer" DROP CONSTRAINT "Officer_policeStationId_fkey";

-- DropForeignKey
ALTER TABLE "PoliceStation" DROP CONSTRAINT "PoliceStation_districtId_fkey";

-- DropForeignKey
ALTER TABLE "PoliceStation" DROP CONSTRAINT "PoliceStation_governorateId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_districtId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_governorateId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_policeStationId_fkey";

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "districtId",
DROP COLUMN "governorateId",
ADD COLUMN     "assignedOfficerId" TEXT,
ADD COLUMN     "hierarchyEntityId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
DROP COLUMN "priority",
ADD COLUMN     "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "policeStationId";

-- AlterTable
ALTER TABLE "Officer" DROP COLUMN "districtId",
DROP COLUMN "governorateId",
DROP COLUMN "policeStationId",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dateOfEnlistment" TIMESTAMP(3),
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "unitId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "districtId",
DROP COLUMN "governorateId",
DROP COLUMN "policeStationId",
ADD COLUMN     "militaryNumber" TEXT NOT NULL,
ADD COLUMN     "position" TEXT NOT NULL,
ADD COLUMN     "province" TEXT NOT NULL,
ADD COLUMN     "rank" TEXT NOT NULL,
ALTER COLUMN "fullName" SET NOT NULL,
ALTER COLUMN "department" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserPermission" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "granted" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "AdminUser";

-- DropTable
DROP TABLE "District";

-- DropTable
DROP TABLE "Governorate";

-- DropTable
DROP TABLE "PoliceStation";

-- CreateTable
CREATE TABLE "HierarchyEntity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "HierarchyType" NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HierarchyEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "hierarchyEntityId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicField" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "validationRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicRecord" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicFile" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "hierarchyEntityId" TEXT NOT NULL,
    "parentFolderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentNumber" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "changes" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "dateTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "caseId" TEXT,
    "hierarchyEntityId" TEXT,
    "reportedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "fromRank" TEXT NOT NULL,
    "toRank" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "reason" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "type" "TransferType" NOT NULL,
    "fromDepartment" TEXT,
    "toDepartment" TEXT,
    "fromUnit" TEXT,
    "toUnit" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "reason" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalty" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "type" "PenaltyType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "issuedBy" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantedPerson" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "alias" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "identificationNumber" TEXT,
    "gender" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "eyeColor" TEXT,
    "hairColor" TEXT,
    "distinguishingMarks" TEXT,
    "lastKnownLocation" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WantedPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantedAttachment" (
    "id" TEXT NOT NULL,
    "wantedPersonId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WantedAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circular" (
    "id" TEXT NOT NULL,
    "circularNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "issuingAuthority" TEXT NOT NULL,
    "wantedPersonId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Circular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prison" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "capacity" INTEGER NOT NULL,
    "currentPopulation" INTEGER NOT NULL DEFAULT 0,
    "securityLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "cellNumber" TEXT NOT NULL,
    "prisonId" TEXT NOT NULL,
    "type" "CellType" NOT NULL DEFAULT 'SHARED',
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prisoner" (
    "id" TEXT NOT NULL,
    "prisonerNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT NOT NULL,
    "nationality" TEXT,
    "identificationNumber" TEXT,
    "photoUrl" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "expectedReleaseDate" TIMESTAMP(3),
    "status" "PrisonerStatus" NOT NULL DEFAULT 'REMAND',
    "crimeType" TEXT,
    "sentenceYears" INTEGER,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "prisonId" TEXT NOT NULL,
    "cellId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prisoner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "prisonerId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorIdNumber" TEXT,
    "relationship" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "operationNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "hierarchyEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patrol" (
    "id" TEXT NOT NULL,
    "patrolNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "PatrolStatus" NOT NULL DEFAULT 'ACTIVE',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "route" JSONB,
    "assignedOfficers" TEXT[],
    "location" TEXT,
    "hierarchyEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patrol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyCall" (
    "id" TEXT NOT NULL,
    "callNumber" TEXT NOT NULL,
    "callerName" TEXT NOT NULL,
    "callerPhone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "status" "EmergencyCallStatus" NOT NULL DEFAULT 'RECEIVED',
    "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
    "dispatchedUnit" TEXT,
    "responseTime" INTEGER,
    "resolution" TEXT,
    "assignedOfficer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "chassisNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fuelType" TEXT,
    "engineCapacity" INTEGER,
    "ownerName" TEXT NOT NULL,
    "ownerIdNumber" TEXT,
    "ownerPhone" TEXT,
    "ownerAddress" TEXT,
    "registrationDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insuranceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrivingLicense" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "licenseType" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "bloodType" TEXT,
    "restrictions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuingAuthority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrivingLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficViolation" (
    "id" TEXT NOT NULL,
    "violationNumber" TEXT NOT NULL,
    "vehicleId" TEXT,
    "driverName" TEXT NOT NULL,
    "driverLicense" TEXT,
    "violationType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "fineAmount" DOUBLE PRECISION NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "status" "TrafficViolationStatus" NOT NULL DEFAULT 'ISSUED',
    "paidAmount" DOUBLE PRECISION,
    "paidDate" TIMESTAMP(3),
    "officerBadge" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrafficViolation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HierarchyEntity_code_key" ON "HierarchyEntity"("code");

-- CreateIndex
CREATE INDEX "HierarchyEntity_parentId_idx" ON "HierarchyEntity"("parentId");

-- CreateIndex
CREATE INDEX "HierarchyEntity_type_idx" ON "HierarchyEntity"("type");

-- CreateIndex
CREATE INDEX "DynamicForm_hierarchyEntityId_idx" ON "DynamicForm"("hierarchyEntityId");

-- CreateIndex
CREATE INDEX "DynamicField_formId_idx" ON "DynamicField"("formId");

-- CreateIndex
CREATE INDEX "DynamicRecord_formId_idx" ON "DynamicRecord"("formId");

-- CreateIndex
CREATE INDEX "DynamicFile_recordId_idx" ON "DynamicFile"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveFolder_code_key" ON "ArchiveFolder"("code");

-- CreateIndex
CREATE INDEX "ArchiveFolder_hierarchyEntityId_idx" ON "ArchiveFolder"("hierarchyEntityId");

-- CreateIndex
CREATE INDEX "ArchiveFolder_parentFolderId_idx" ON "ArchiveFolder"("parentFolderId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveDocument_documentNumber_key" ON "ArchiveDocument"("documentNumber");

-- CreateIndex
CREATE INDEX "ArchiveDocument_folderId_idx" ON "ArchiveDocument"("folderId");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_incidentNumber_key" ON "Incident"("incidentNumber");

-- CreateIndex
CREATE INDEX "Incident_caseId_idx" ON "Incident"("caseId");

-- CreateIndex
CREATE INDEX "Incident_hierarchyEntityId_idx" ON "Incident"("hierarchyEntityId");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Section_code_key" ON "Section"("code");

-- CreateIndex
CREATE INDEX "Section_departmentId_idx" ON "Section"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE INDEX "Unit_sectionId_idx" ON "Unit"("sectionId");

-- CreateIndex
CREATE INDEX "Promotion_officerId_idx" ON "Promotion"("officerId");

-- CreateIndex
CREATE INDEX "Transfer_officerId_idx" ON "Transfer"("officerId");

-- CreateIndex
CREATE INDEX "Leave_officerId_idx" ON "Leave"("officerId");

-- CreateIndex
CREATE INDEX "Penalty_officerId_idx" ON "Penalty"("officerId");

-- CreateIndex
CREATE INDEX "WantedPerson_status_idx" ON "WantedPerson"("status");

-- CreateIndex
CREATE INDEX "WantedPerson_firstName_lastName_idx" ON "WantedPerson"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "WantedAttachment_wantedPersonId_idx" ON "WantedAttachment"("wantedPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "Circular_circularNumber_key" ON "Circular"("circularNumber");

-- CreateIndex
CREATE INDEX "Circular_status_idx" ON "Circular"("status");

-- CreateIndex
CREATE INDEX "Circular_circularNumber_idx" ON "Circular"("circularNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Prison_code_key" ON "Prison"("code");

-- CreateIndex
CREATE INDEX "Cell_prisonId_idx" ON "Cell"("prisonId");

-- CreateIndex
CREATE UNIQUE INDEX "Cell_cellNumber_prisonId_key" ON "Cell"("cellNumber", "prisonId");

-- CreateIndex
CREATE UNIQUE INDEX "Prisoner_prisonerNumber_key" ON "Prisoner"("prisonerNumber");

-- CreateIndex
CREATE INDEX "Prisoner_prisonId_idx" ON "Prisoner"("prisonId");

-- CreateIndex
CREATE INDEX "Prisoner_cellId_idx" ON "Prisoner"("cellId");

-- CreateIndex
CREATE INDEX "Prisoner_status_idx" ON "Prisoner"("status");

-- CreateIndex
CREATE INDEX "Visit_prisonerId_idx" ON "Visit"("prisonerId");

-- CreateIndex
CREATE INDEX "Visit_visitDate_idx" ON "Visit"("visitDate");

-- CreateIndex
CREATE UNIQUE INDEX "Operation_operationNumber_key" ON "Operation"("operationNumber");

-- CreateIndex
CREATE INDEX "Operation_hierarchyEntityId_idx" ON "Operation"("hierarchyEntityId");

-- CreateIndex
CREATE INDEX "Operation_status_idx" ON "Operation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Patrol_patrolNumber_key" ON "Patrol"("patrolNumber");

-- CreateIndex
CREATE INDEX "Patrol_hierarchyEntityId_idx" ON "Patrol"("hierarchyEntityId");

-- CreateIndex
CREATE INDEX "Patrol_status_idx" ON "Patrol"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyCall_callNumber_key" ON "EmergencyCall"("callNumber");

-- CreateIndex
CREATE INDEX "EmergencyCall_status_idx" ON "EmergencyCall"("status");

-- CreateIndex
CREATE INDEX "EmergencyCall_priority_idx" ON "EmergencyCall"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_chassisNumber_key" ON "Vehicle"("chassisNumber");

-- CreateIndex
CREATE INDEX "Vehicle_plateNumber_idx" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE INDEX "Vehicle_ownerName_idx" ON "Vehicle"("ownerName");

-- CreateIndex
CREATE UNIQUE INDEX "DrivingLicense_licenseNumber_key" ON "DrivingLicense"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DrivingLicense_idNumber_key" ON "DrivingLicense"("idNumber");

-- CreateIndex
CREATE INDEX "DrivingLicense_licenseNumber_idx" ON "DrivingLicense"("licenseNumber");

-- CreateIndex
CREATE INDEX "DrivingLicense_idNumber_idx" ON "DrivingLicense"("idNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TrafficViolation_violationNumber_key" ON "TrafficViolation"("violationNumber");

-- CreateIndex
CREATE INDEX "TrafficViolation_vehicleId_idx" ON "TrafficViolation"("vehicleId");

-- CreateIndex
CREATE INDEX "TrafficViolation_violationNumber_idx" ON "TrafficViolation"("violationNumber");

-- CreateIndex
CREATE INDEX "TrafficViolation_status_idx" ON "TrafficViolation"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_officerId_idx" ON "AuditLog"("officerId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Case_hierarchyEntityId_idx" ON "Case"("hierarchyEntityId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_priority_idx" ON "Case"("priority");

-- CreateIndex
CREATE INDEX "Officer_departmentId_idx" ON "Officer"("departmentId");

-- CreateIndex
CREATE INDEX "Officer_unitId_idx" ON "Officer"("unitId");

-- CreateIndex
CREATE INDEX "Officer_isActive_idx" ON "Officer"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_militaryNumber_key" ON "User"("militaryNumber");

-- AddForeignKey
ALTER TABLE "HierarchyEntity" ADD CONSTRAINT "HierarchyEntity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicForm" ADD CONSTRAINT "DynamicForm_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicField" ADD CONSTRAINT "DynamicField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "DynamicForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicRecord" ADD CONSTRAINT "DynamicRecord_formId_fkey" FOREIGN KEY ("formId") REFERENCES "DynamicForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicRecord" ADD CONSTRAINT "DynamicRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicFile" ADD CONSTRAINT "DynamicFile_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "DynamicRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveFolder" ADD CONSTRAINT "ArchiveFolder_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveFolder" ADD CONSTRAINT "ArchiveFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "ArchiveFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveDocument" ADD CONSTRAINT "ArchiveDocument_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ArchiveFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ArchiveDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantedAttachment" ADD CONSTRAINT "WantedAttachment_wantedPersonId_fkey" FOREIGN KEY ("wantedPersonId") REFERENCES "WantedPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_prisonId_fkey" FOREIGN KEY ("prisonId") REFERENCES "Prison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prisoner" ADD CONSTRAINT "Prisoner_prisonId_fkey" FOREIGN KEY ("prisonId") REFERENCES "Prison"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prisoner" ADD CONSTRAINT "Prisoner_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "Cell"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_prisonerId_fkey" FOREIGN KEY ("prisonerId") REFERENCES "Prisoner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patrol" ADD CONSTRAINT "Patrol_hierarchyEntityId_fkey" FOREIGN KEY ("hierarchyEntityId") REFERENCES "HierarchyEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficViolation" ADD CONSTRAINT "TrafficViolation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
