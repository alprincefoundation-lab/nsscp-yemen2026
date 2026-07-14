-- Add password hash support to Officer for production authentication.
ALTER TABLE "Officer"
ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
