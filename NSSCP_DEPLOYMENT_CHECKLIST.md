# 🏛️ NSSCP — Production Deployment Checklist

**Date:** 2026-07-10
**Status:** ✅ Ready for deployment execution
**Prerequisite:** All 3 migration files refactored and production-safe

---

## Phase 1 — Migration Verification

| # | Check | Command / Query | Expected Result | Status |
|---|-------|----------------|-----------------|--------|
| 1.1 | Full database backup | `pg_dump nsscp_db > backup_$(date +%Y%m%d).sql` | Backup file created | ☐ |
| 1.2 | Record pre-migration row counts | `SELECT table_name, n_live_tup FROM pg_stat_user_tables WHERE schemaname='public' ORDER BY table_name` | Snapshot saved | ☐ |
| 1.3 | Verify migration status | `npx prisma migrate status --schema prisma/schema.prisma` | Common migration: `20260523212212_add_hierarchy_system` | ☐ |
| 1.4 | Apply `init_rbac_system` | Execute refactored `prisma/migrations/20260623134559_init_rbac_system/migration.sql` | 12 new tables, 2 altered tables, 1 enum | ☐ |
| 1.5 | Verify `init_rbac_system` tables | `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('User','Role','Permission','RolePermission','UserPermission','Governorate','District','PoliceStation','AdminUser','Case','CaseAssignment','Department')` | 12 rows returned | ☐ |
| 1.6 | Verify `AuditLog` expanded | `SELECT column_name FROM information_schema.columns WHERE table_name='AuditLog' AND column_name IN ('userId','hierarchyEntityId','hierarchyEntityType','updatedAt')` | 4 rows | ☐ |
| 1.7 | Verify `Officer` expanded | `SELECT column_name FROM information_schema.columns WHERE table_name='Officer' AND column_name IN ('fullName','badgeNumber','email','phoneNumber','isActive','userId')` | 6 rows | ☐ |
| 1.8 | Apply `fakri` | Execute refactored `prisma/migrations/20260624020311_fakri/migration.sql` | 27 new tables, 3 altered tables, 16 enums | ☐ |
| 1.9 | Verify `WantedPerson` expanded | `SELECT column_name FROM information_schema.columns WHERE table_name='WantedPerson' AND column_name IN ('firstName','lastName','wantedNumber','domesticStatus','internationalNotice','isDeleted','updatedAt')` | 7 rows | ☐ |
| 1.10 | Verify total table count | `SELECT count(*) FROM information_schema.tables WHERE table_schema='public'` | Expected: ~55 tables (15 Legacy + 40 new) | ☐ |
| 1.11 | Verify no data loss | Compare row counts with pre-migration snapshot | All Legacy table counts match | ☐ |
| 1.12 | Mark migrations as applied | `npx prisma migrate resolve --applied wanted_persons_init` | Success | ☐ |

---

## Phase 2 — Prisma Verification

| # | Check | Command | Expected Result | Status |
|---|-------|---------|-----------------|--------|
| 2.1 | Backup active schema | `copy prisma\schema.prisma prisma\schema.prisma.pre-unified` | Backup created | ☐ |
| 2.2 | Replace with unified | Copy `prisma/schema.unified.prisma` → `prisma/schema.prisma` | File replaced | ☐ |
| 2.3 | Validate schema | `npx prisma validate` | PASS | ☐ |
| 2.4 | Format schema | `npx prisma format` | PASS | ☐ |
| 2.5 | Generate Prisma Client | `npx prisma generate` | PASS (0 errors) | ☐ |
| 2.6 | Verify all models in client | Check `node_modules/.prisma/client/index.d.ts` has all 103 models | All models exported | ☐ |
| 2.7 | Migration status after schema switch | `npx prisma migrate status --schema prisma/schema.prisma` | "Database schema is up to date" | ☐ |

---

## Phase 3 — Database Verification

| # | Check | Query | Expected Result | Status |
|---|-------|-------|-----------------|--------|
| 3.1 | All FKs valid | `SELECT tc.table_name, tc.constraint_name FROM information_schema.table_constraints tc WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'` | All expected FKs exist | ☐ |
| 3.2 | All indexes exist | `SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname` | ~100 indexes | ☐ |
| 3.3 | No orphan references | Run FK integrity check | 0 violations | ☐ |
| 3.4 | WantedPerson Legacy data intact | `SELECT id, fullName, identityNumber, dangerLevel, status FROM "WantedPerson" LIMIT 10` | Legacy records present | ☐ |
| 3.5 | AuditLog Legacy data intact | `SELECT id, action, entityType, officerId, createdAt FROM "AuditLog" LIMIT 10` | Legacy records present | ☐ |
| 3.6 | Officer Legacy data intact | `SELECT id, name, rank, role, department, accessLevel FROM "Officer" LIMIT 10` | Legacy records present | ☐ |
| 3.7 | Test database connection | `npx prisma db execute --stdin <<< 'SELECT 1'` (or via application) | Returns 1 | ☐ |

---

## Phase 4 — Application Verification

| # | Check | Action | Expected Result | Status |
|---|-------|--------|-----------------|--------|
| 4.1 | TypeScript compilation | `npx tsc --noEmit` | 0 errors | ☐ |
| 4.2 | Production build | `npm run build` | PASS (105 pages, ~85 API routes) | ☐ |
| 4.3 | Start server | `npm run start` | Server starts on localhost:3000 | ☐ |
| 4.4 | Health check | `curl http://localhost:3000/api/health` | 200 OK | ☐ |
| 4.5 | Login with valid credentials | POST `/api/auth/login` with valid militaryId + password | 200 + JWT token | ☐ |
| 4.6 | Login with invalid credentials | POST `/api/auth/login` with invalid credentials | 401 Unauthorized | ☐ |
| 4.7 | Token verification | GET `/api/auth/me` with Bearer token | 200 + user data | ☐ |
| 4.8 | Dashboard stats | GET `/api/dashboard/stats` | 200 + stats JSON | ☐ |
| 4.9 | List cases | GET `/api/cases` | 200 + case array | ☐ |
| 4.10 | Create case | POST `/api/cases` | 201 + new case | ☐ |
| 4.11 | List wanted persons | GET `/api/wanted-persons` | 200 + wanted persons array | ☐ |
| 4.12 | List prisoners | GET `/api/prison/prisoners` | 200 + prisoner array | ☐ |
| 4.13 | Hierarchy | GET `/api/hierarchy` | 200 + hierarchy tree | ☐ |
| 4.14 | Audit logs | GET `/api/audit` | 200 + logs array | ☐ |
| 4.15 | All static pages load | Visit `/dashboard`, `/wanted-persons`, etc. | Pages render | ☐ |
| 4.16 | No 500 errors in logs | Check server logs | Clean logs | ☐ |

---

## Phase 5 — Rollback Verification

| # | Check | Action | Expected Result | Status |
|---|-------|--------|-----------------|--------|
| 5.1 | Rollback to Legacy schema | Copy `prisma/schema.prisma.pre-unified` → `prisma/schema.prisma` | Reverted | ☐ |
| 5.2 | Prisma generate after rollback | `npx prisma generate` | PASS | ☐ |
| 5.3 | Build after rollback | `npm run build` | PASS | ☐ |
| 5.4 | Legacy routes still work | Test `/api/audit`, `/api/reports` | 200 | ☐ |
| 5.5 | Restore unified schema | Copy `prisma/schema.unified.prisma` → `prisma/schema.prisma` | Ready | ☐ |

---

## Phase 6 — Final Sign-off

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 6.1 | All 55+ tables exist in database | Verified | ☐ |
| 6.2 | All Legacy data preserved | Row counts match pre-migration | ☐ |
| 6.3 | Application builds successfully | `npm run build` PASS | ☐ |
| 6.4 | All API routes respond | 200/201 status codes | ☐ |
| 6.5 | Login works | Authentication flow complete | ☐ |
| 6.6 | RBAC works | Permission checks functional | ☐ |
| 6.7 | Dashboard loads | All stats visible | ☐ |
| 6.8 | No destructive operations executed | Audit confirms | ☐ |
| 6.9 | Rollback tested | Revert to Legacy schema works | ☐ |
| 6.10 | Migration history aligned | `prisma migrate status` gives "up to date" | ☐ |

---

## Deployment Decision

```
☐ All Phase 1 checks passed → Migrations applied safely
☐ All Phase 2 checks passed → Prisma Client generated from unified schema
☐ All Phase 3 checks passed → Database integrity verified
☐ All Phase 4 checks passed → Application fully functional
☐ All Phase 5 checks passed → Rollback confirmed

Sign-off: _______________ Date: _______________

✅ NSSCP is CLEARED FOR PRODUCTION DEPLOYMENT
```

---

**End of Deployment Checklist — `NSSCP_DEPLOYMENT_CHECKLIST.md`**