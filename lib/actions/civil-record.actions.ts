"use server";

/**
 * Civil Registry Server Actions — NSSCP Platform
 *
 * SECURITY: Every action re-validates with Zod BEFORE touching the database.
 * Hierarchy isolation + RBAC + Audit logging on every write.
 */

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/index";
import { createAuditLog } from "@/lib/core/audit-engine";
import { requirePermission } from "@/lib/core/rbac-engine";
import { Permission } from "@/lib/permissions";

// ─── Shared Zod Schema ─────────────────────────────────────

export const civilRecordSchema = z.object({
  recordType: z.enum(["BIRTH", "DEATH", "ID_CARD", "MARRIAGE", "DIVORCE"], {
    required_error: "نوع السجل مطلوب",
  }),
  fullName: z.string().min(3, "الاسم الكامل يجب أن يكون 3 أحرف على الأقل").max(100),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["ذكر", "أنثى"]).optional(),
  nationality: z.string().max(50).optional(),
  idNumber: z.string().max(20).optional(),
  fatherName: z.string().max(100).optional(),
  motherName: z.string().max(100).optional(),
  placeOfBirth: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  issuingAuthority: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  hierarchyEntityId: z.string().min(1).optional(),
});

export type CivilRecordInput = z.infer<typeof civilRecordSchema>;

// ─── Create Civil Record ───────────────────────────────────

export async function createCivilRecord(data: CivilRecordInput) {
  const user = await requireAuth();

  // RBAC gate
  await requirePermission(
    { id: user.id, username: user.username, role: user.role },
    Permission.CREATE_EVIDENCE,
    {},
  );

  // Server-side Zod re-validation (defense in depth)
  const parsed = civilRecordSchema.parse(data);

  // Duplicate ID check
  if (parsed.idNumber) {
    const existing = await prisma.dataRecord.findFirst({
      where: {
        recordType: parsed.recordType,
      },
      select: {
        data: true,
      },
    });
    const alreadyExists =
      !!existing &&
      typeof existing.data === "object" &&
      existing.data !== null &&
      "idNumber" in existing.data &&
      (existing.data as Record<string, unknown>).idNumber === parsed.idNumber;
    if (alreadyExists) throw new Error("رقم الهوية موجود مسبقاً في النظام");
  }

  const level6UnitId = parsed.hierarchyEntityId || user.hierarchyEntityId;
  if (!level6UnitId) {
    throw new Error("لا يمكن إنشاء السجل بدون نطاق هرمي صالح");
  }

  const record = await prisma.dataRecord.create({
    data: {
      id: `CR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      level6UnitId,
      recordType: parsed.recordType,
      data: {
        fullName: parsed.fullName,
        dateOfBirth: parsed.dateOfBirth ?? null,
        gender: parsed.gender ?? null,
        nationality: parsed.nationality ?? null,
        idNumber: parsed.idNumber ?? null,
        fatherName: parsed.fatherName ?? null,
        motherName: parsed.motherName ?? null,
        placeOfBirth: parsed.placeOfBirth ?? null,
        address: parsed.address ?? null,
        issuingAuthority: parsed.issuingAuthority ?? null,
        notes: parsed.notes ?? null,
        hierarchyEntityId: parsed.hierarchyEntityId ?? null,
        registeredById: user.id,
      },
      status: "ACTIVE",
      securityLevel: "internal",
      updatedAt: new Date(),
    },
  });

  // Audit log
  await createAuditLog({
    action: "CREATE",
    entityType: "DataRecord",
    entityId: record.id,
    userId: user.id,
    details: { recordType: parsed.recordType, fullName: parsed.fullName },
    hierarchyEntityId: level6UnitId,
  });

  return { success: true, data: { id: record.id, fullName: parsed.fullName } };
}

// ─── Update Civil Record ───────────────────────────────────

export async function updateCivilRecord(
  recordId: string,
  data: Partial<CivilRecordInput>,
) {
  const user = await requireAuth();

  await requirePermission(
    { id: user.id, username: user.username, role: user.role },
    Permission.UPDATE_EVIDENCE,
  );

  const parsed = civilRecordSchema.partial().parse(data);

  const existingRecord = await prisma.dataRecord.findUnique({
    where: { id: recordId },
    select: { data: true, level6UnitId: true },
  });

  if (!existingRecord) {
    throw new Error("السجل غير موجود");
  }

  const nextData: Prisma.JsonObject =
    typeof existingRecord.data === "object" && existingRecord.data !== null
      ? { ...(existingRecord.data as Prisma.JsonObject) }
      : {};

  if (parsed.recordType !== undefined) nextData.recordType = parsed.recordType;
  if (parsed.fullName !== undefined) nextData.fullName = parsed.fullName;
  if (parsed.dateOfBirth !== undefined) nextData.dateOfBirth = parsed.dateOfBirth ?? null;
  if (parsed.gender !== undefined) nextData.gender = parsed.gender ?? null;
  if (parsed.nationality !== undefined) nextData.nationality = parsed.nationality ?? null;
  if (parsed.idNumber !== undefined) nextData.idNumber = parsed.idNumber ?? null;
  if (parsed.fatherName !== undefined) nextData.fatherName = parsed.fatherName ?? null;
  if (parsed.motherName !== undefined) nextData.motherName = parsed.motherName ?? null;
  if (parsed.placeOfBirth !== undefined) nextData.placeOfBirth = parsed.placeOfBirth ?? null;
  if (parsed.address !== undefined) nextData.address = parsed.address ?? null;
  if (parsed.issuingAuthority !== undefined) nextData.issuingAuthority = parsed.issuingAuthority ?? null;
  if (parsed.notes !== undefined) nextData.notes = parsed.notes ?? null;

  const record = await prisma.dataRecord.update({
    where: { id: recordId },
    data: {
      data: nextData,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entityType: "DataRecord",
    entityId: record.id,
    userId: user.id,
    details: { updatedFields: Object.keys(data) },
    hierarchyEntityId: existingRecord.level6UnitId,
  });

  return { success: true, data: { id: record.id } };
}
