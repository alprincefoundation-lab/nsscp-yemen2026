"use server";

/**
 * Civil Registry Server Actions — NSSCP Platform
 *
 * SECURITY: Every action re-validates with Zod BEFORE touching the database.
 * Hierarchy isolation + RBAC + Audit logging on every write.
 */

import { z } from "zod";
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
  hierarchyEntityId: z.string().uuid().optional(),
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
    const existing = await prisma.civilRecord.findFirst({
      where: { idNumber: parsed.idNumber },
    });
    if (existing) throw new Error("رقم الهوية موجود مسبقاً في النظام");
  }

  const record = await prisma.civilRecord.create({
    data: {
      recordType: parsed.recordType,
      fullName: parsed.fullName,
      dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
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
      status: "ACTIVE",
    },
  });

  // Audit log
  await createAuditLog({
    action: "CREATE",
    entityType: "CIVIL_RECORD",
    entityId: record.id,
    userId: user.id,
    details: { recordType: parsed.recordType, fullName: parsed.fullName },
    hierarchyEntityId: record.hierarchyEntityId,
  });

  return { success: true, data: { id: record.id, fullName: record.fullName } };
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

  const record = await (prisma as any).civilRecord.update({
    where: { id: recordId },
    data: {
      ...(parsed.recordType && { recordType: parsed.recordType as any }),
      ...(parsed.fullName && { fullName: parsed.fullName }),
      ...(parsed.dateOfBirth !== undefined && {
        dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
      }),
      ...(parsed.gender !== undefined && { gender: parsed.gender }),
      ...(parsed.nationality !== undefined && { nationality: parsed.nationality }),
      ...(parsed.idNumber !== undefined && { idNumber: parsed.idNumber }),
      ...(parsed.fatherName !== undefined && { fatherName: parsed.fatherName }),
      ...(parsed.motherName !== undefined && { motherName: parsed.motherName }),
      ...(parsed.placeOfBirth !== undefined && { placeOfBirth: parsed.placeOfBirth }),
      ...(parsed.address !== undefined && { address: parsed.address }),
      ...(parsed.issuingAuthority !== undefined && { issuingAuthority: parsed.issuingAuthority }),
      ...(parsed.notes !== undefined && { notes: parsed.notes }),
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entityType: "CIVIL_RECORD",
    entityId: record.id,
    userId: user.id,
    details: { updatedFields: Object.keys(data) },
    hierarchyEntityId: record.hierarchyEntityId,
  });

  return { success: true, data: { id: record.id } };
}