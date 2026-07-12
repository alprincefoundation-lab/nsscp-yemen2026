// ============================================================================
// NSSCP COMPLETE SEED — متوافق 100% مع schema.prisma الحالي (15 جدول Legacy)
// ============================================================================
// Idempotent via upsert — safe to run multiple times
// ============================================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 22 Governorates of Yemen
const GOVERNORATES = [
  'أمانة العاصمة', 'عدن', 'صنعاء', 'تعز', 'الحديدة', 'حضرموت',
  'إب', 'ذمار', 'شبوة', 'أبين', 'لحج', 'صعدة',
  'مأرب', 'الجوف', 'البيضاء', 'حجة', 'المهرة', 'المحويت',
  'الضالع', 'عمران', 'ريمة', 'سقطرى',
]

// Gov codes (3-letter)
const GOV_CODES = [
  'AMN','ADN','SAN','TAI','HUD','HDN',
  'IBB','DHA','SHW','ABN','LAH','SAD',
  'MAR','JAW','BAY','HAG','MHR','MWI',
  'DHL','AMR','RAY','SQT',
]

async function main() {
  console.log('🌱 Starting NSSCP seed (Legacy schema — 15 tables)...\n')
  const now = new Date()

  // 1. CENTRAL COMMAND
  const cc = await prisma.centralCommand.upsert({
    where: { code: 'CC-MOI-01' },
    update: { name: 'وزارة الداخلية - القيادة المركزية', description: 'Central Command — Ministry of Interior', updatedAt: now },
    create: { id: 'CC-MOI', name: 'وزارة الداخلية - القيادة المركزية', code: 'CC-MOI-01', description: 'Central Command — Ministry of Interior', updatedAt: now },
  })
  console.log('✅ CentralCommand:', cc.name)

  // 2. PROVINCES — 22 محافظة
  const provIds: Record<string, string> = {}
  for (let i = 0; i < GOVERNORATES.length; i++) {
    const code = `PROV-${GOV_CODES[i]}`
    const p = await prisma.province.upsert({
      where: { code },
      update: { name: GOVERNORATES[i], updatedAt: now },
      create: { id: `PROV-${String(i+1).padStart(2,'0')}`, name: GOVERNORATES[i], code, centralCommandId: cc.id, updatedAt: now },
    })
    provIds[p.code] = p.id
    console.log(`  ✅ Province: ${p.name} (${p.code})`)
  }

  // 3. HIERARCHY — Under Aden as demonstration
  //    Level3Unit → Level4Department → Level5Section → Level6Unit
  const aden = provIds['PROV-ADN']
  if (!aden) { console.error('❌ Aden not found'); return }

  // Level3Unit: CID Directorate
  const cid = await prisma.level3Unit.upsert({
    where: { code: 'L3-ADN-CID' },
    update: { name: 'الإدارة العامة للبحث الجنائي', unitType: 'DIRECTORATE', provinceId: aden, updatedAt: now },
    create: { id: 'L3-ADN-01', name: 'الإدارة العامة للبحث الجنائي', code: 'L3-ADN-CID', unitType: 'DIRECTORATE', provinceId: aden, updatedAt: now },
  })
  console.log(`  ✅ Level3Unit: ${cid.name}`)

  // Level4Department: Investigations
  const inv = await prisma.level4Department.upsert({
    where: { code: 'L4-ADN-INV' },
    update: { name: 'إدارة التحقيقات الجنائية', departmentType: 'INVESTIGATIONS', level3UnitId: cid.id, updatedAt: now },
    create: { id: 'L4-ADN-01', name: 'إدارة التحقيقات الجنائية', code: 'L4-ADN-INV', departmentType: 'INVESTIGATIONS', level3UnitId: cid.id, updatedAt: now },
  })
  console.log(`  ✅ Level4Department: ${inv.name}`)

  // Level4Department: Forensics
  const fore = await prisma.level4Department.upsert({
    where: { code: 'L4-ADN-FOR' },
    update: { name: 'إدارة الأدلة الجنائية', departmentType: 'FORENSICS', level3UnitId: cid.id, updatedAt: now },
    create: { id: 'L4-ADN-02', name: 'إدارة الأدلة الجنائية', code: 'L4-ADN-FOR', departmentType: 'FORENSICS', level3UnitId: cid.id, updatedAt: now },
  })
  console.log(`  ✅ Level4Department: ${fore.name}`)

  // Level5Section: Homicide under Investigations
  const hom = await prisma.level5Section.upsert({
    where: { code: 'L5-ADN-HOM' },
    update: { name: 'شعبة جرائم القتل', sectionType: 'HOMICIDE', level4DepartmentId: inv.id, updatedAt: now },
    create: { id: 'L5-ADN-01', name: 'شعبة جرائم القتل', code: 'L5-ADN-HOM', sectionType: 'HOMICIDE', level4DepartmentId: inv.id, updatedAt: now },
  })
  console.log(`  ✅ Level5Section: ${hom.name}`)

  // Level5Section: Cyber under Investigations
  const cyb = await prisma.level5Section.upsert({
    where: { code: 'L5-ADN-CYB' },
    update: { name: 'شعبة الجرائم الإلكترونية', sectionType: 'CYBER', level4DepartmentId: inv.id, updatedAt: now },
    create: { id: 'L5-ADN-02', name: 'شعبة الجرائم الإلكترونية', code: 'L5-ADN-CYB', sectionType: 'CYBER', level4DepartmentId: inv.id, updatedAt: now },
  })
  console.log(`  ✅ Level5Section: ${cyb.name}`)

  // Level6Unit: DNA Lab under Homicide
  const dna = await prisma.level6Unit.upsert({
    where: { code: 'L6-ADN-DNA' },
    update: { name: 'وحدة البصمة الوراثية', unitType: 'DNA_LAB', level5SectionId: hom.id, updatedAt: now },
    create: { id: 'L6-ADN-01', name: 'وحدة البصمة الوراثية', code: 'L6-ADN-DNA', unitType: 'DNA_LAB', level5SectionId: hom.id, updatedAt: now },
  })
  console.log(`  ✅ Level6Unit: ${dna.name}`)

  // 4. OFFICERS
  const admin = await prisma.officer.upsert({
    where: { id: 'OFF-ADMIN' },
    update: { name: 'admin', rank: 'لواء', role: 'SUPER_ADMIN', department: 'القيادة المركزية', accessLevel: 1, updatedAt: now },
    create: { id: 'OFF-ADMIN', name: 'admin', rank: 'لواء', role: 'SUPER_ADMIN', department: 'القيادة المركزية', accessLevel: 1, updatedAt: now },
  })
  console.log(`✅ Admin Officer: ${admin.name} (${admin.rank})`)

  const investigator = await prisma.officer.upsert({
    where: { id: 'OFF-INV' },
    update: { name: 'investigator', rank: 'مقدم', role: 'OFFICER', department: inv.name, accessLevel: 5, updatedAt: now },
    create: { id: 'OFF-INV', name: 'investigator', rank: 'مقدم', role: 'OFFICER', department: inv.name, accessLevel: 5, updatedAt: now },
  })
  console.log(`✅ Investigator: ${investigator.name} (${investigator.rank})`)

  // 5. LEVEL ASSIGNMENTS
  await prisma.levelAssignment.upsert({
    where: { officerId_level_unitId: { officerId: admin.id, level: 1, unitId: cc.id } },
    update: { canView: true, canEdit: true, canDelete: true, updatedAt: now },
    create: { id: 'LA-ADMIN-CC', officerId: admin.id, level: 1, unitId: cc.id, canView: true, canEdit: true, canDelete: true, updatedAt: now },
  })
  console.log('✅ LevelAssignment: Admin → Central Command (full access)')

  await prisma.levelAssignment.upsert({
    where: { officerId_level_unitId: { officerId: investigator.id, level: 3, unitId: cid.id } },
    update: { canView: true, canEdit: true, canDelete: false, updatedAt: now },
    create: { id: 'LA-INV-CID', officerId: investigator.id, level: 3, unitId: cid.id, canView: true, canEdit: true, canDelete: false, updatedAt: now },
  })
  console.log('✅ LevelAssignment: Investigator → CID (view+edit)')

  // 6. SAMPLE DATA RECORDS (استمارات)
  const rec1 = await prisma.dataRecord.upsert({
    where: { id: 'DR-001' },
    update: { data: { title: 'محضر تحقيق - قضية 2024/001', details: 'تفاصيل التحقيق في القضية...' }, updatedAt: now },
    create: { id: 'DR-001', level6UnitId: dna.id, recordType: 'INVESTIGATION_REPORT', data: { title: 'محضر تحقيق - قضية 2024/001', details: 'تفاصيل التحقيق في القضية...' }, status: 'active', securityLevel: 'internal', updatedAt: now },
  })
  console.log(`✅ DataRecord: ${rec1.recordType}`)

  // 7. SAMPLE WANTED PERSONS (Int id — autoincrement, no id passed)
  const wanted = [
    { fullName: 'أحمد محمد علي', identityNumber: '1234567890123', nationality: 'يمني', chargeDetails: 'جرائم قتل وتجارة مخدرات', issuingProvince: 'عدن', dangerLevel: 'عالي جداً', status: 'مطلوب حياً' },
    { fullName: 'خالد عبد الله صالح', identityNumber: '9876543210987', nationality: 'يمني', chargeDetails: 'تهريب أسلحة وتمويل إرهاب', issuingProvince: 'مأرب', dangerLevel: 'عالي', status: 'مطلوب حياً' },
    { fullName: 'محمد حسن ناصر', identityNumber: '4567891230456', nationality: 'يمني', chargeDetails: 'جرائم إلكترونية واختراق أنظمة', issuingProvince: 'عدن', dangerLevel: 'متوسط', status: 'مطلوب حياً' },
  ]
  for (const w of wanted) {
    await prisma.wantedPerson.upsert({
      where: { identityNumber: w.identityNumber },
      update: {},
      create: w,
    })
    console.log(`✅ WantedPerson: ${w.fullName}`)
  }

  // 8. SAMPLE FACILITY
  await prisma.facility.upsert({
    where: { id: 1 },
    update: { facilityName: 'سجن عدن المركزي', facilityType: 'PRISON', province: 'عدن', district: 'خور مكسر', contactPerson: 'مدير السجن', phoneNumber: '02-2222222' },
    create: { province: 'عدن', district: 'خور مكسر', facilityType: 'PRISON', facilityName: 'سجن عدن المركزي', contactPerson: 'مدير السجن', phoneNumber: '02-2222222' },
  })
  console.log('✅ Facility: سجن عدن المركزي')

  // 9. SAMPLE REPORTS
  await prisma.report.upsert({
    where: { id: 'RPT-001' },
    update: { title: 'تقرير الحالة الأمنية - يوليو 2026', description: 'تقرير شهري شامل للحالة الأمنية', priority: 'HIGH' },
    create: { id: 'RPT-001', title: 'تقرير الحالة الأمنية - يوليو 2026', description: 'تقرير شهري شامل للحالة الأمنية', department: 'الإدارة العامة للبحث الجنائي', status: 'active', priority: 'HIGH' },
  })
  console.log('✅ Report: تقرير الحالة الأمنية')

  // 10. AUDIT LOG
  await prisma.auditLog.create({
    data: { action: 'SEED', entityType: 'SYSTEM', entityId: 'SEED-001', officerId: admin.id, details: { message: 'Database seed completed — 22 provinces, CID hierarchy, officers, wanted persons' } },
  })

  console.log('')
  console.log('🌱 Seed completed successfully!')
  console.log('══════════════════════════════════════════════')
  console.log(`  Admin login:    username="${admin.name}"  password="${admin.name}"`)
  console.log(`  Investigator:   username="${investigator.name}"  password="${investigator.name}"`)
  console.log('══════════════════════════════════════════════')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error('❌ Seed failed:', e); await prisma.$disconnect(); process.exit(1) })