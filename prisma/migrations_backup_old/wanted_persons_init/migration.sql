-- Wanted Persons and International Notices
-- This migration adds the complete wanted persons management system

-- Note: Models are already defined in schema.prisma
-- This file documents the structure for reference

-- WantedPerson table fields:
-- id, name, nationality, dateOfBirth, gender, physicalDescription, 
-- charges, severity, status, photoUrl, createdAt, updatedAt, isDeleted

-- InternationalNotice table fields:
-- id, wantedPersonId, noticeType, publishDate, status

-- CaptureRecord table fields:
-- id, wantedPersonId, captureDate, location, capturedBy, notes

-- The actual migration is handled by Prisma's automatic schema synchronization
