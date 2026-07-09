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
