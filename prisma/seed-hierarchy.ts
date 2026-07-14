/**
 * NSSCP National Organizational Hierarchy — Seed Data
 * 
 * Implements the full national hierarchy:
 * 
 * وزارة الداخلية (Ministry of Interior)
 *   └── CentralCommand (NSSCP)
 *       ├── Province: Taiz
 *       │   ├── Level3: أمن المحافظة
 *       │   │   ├── Level4: البحث الجنائي
 *       │   │   │   ├── Level5: وحدة التحريات
 *       │   │   │   │   └── Level6: قسم شرطة القاهرة
 *       │   │   │   └── Level5: وحدة الأدلة
 *       │   │   ├── Level4: المرور
 *       │   │   └── Level4: الجوازات
 *       │   └── Level3: الدفاع المدني
 *       ├── Province: Aden
 *       └── Province: Hadramout
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Helper: returns current date — DRY */
const now = () => new Date();

async function main() {
  console.log('🌐 Seeding NSSCP National Organizational Hierarchy...\n');

  // ═══════════════════════════════════════════════════════════════════════
  // LEVEL 0: Ministry → CentralCommand
  // ═══════════════════════════════════════════════════════════════════════
  const ministry = await prisma.centralCommand.upsert({
    where: { code: 'MOI-NSSCP' },
    update: { name: 'الإدارة العامة للمنظومة الوطنية الذكية للأمن والسيطرة', updatedAt: now() },
    create: {
      id: 'cc-ministry-001',
      name: 'الإدارة العامة للمنظومة الوطنية الذكية للأمن والسيطرة',
      code: 'MOI-NSSCP',
      description: 'القيادة المركزية للمنظومة الوطنية — وزارة الداخلية',
      updatedAt: now(),
    },
  });
  console.log(`✅ CentralCommand: ${ministry.name}`);

  // ═══════════════════════════════════════════════════════════════════════
  // LEVEL 1: Governorates → Province
  // ═══════════════════════════════════════════════════════════════════════

  const provinces = [
    { id: 'prov-taiz-001', name: 'محافظة تعز', code: 'GOV-TAIZ' },
    { id: 'prov-aden-001', name: 'محافظة عدن', code: 'GOV-ADEN' },
    { id: 'prov-hadramout-001', name: 'محافظة حضرموت', code: 'GOV-HADRAMOUT' },
    { id: 'prov-sanaa-001', name: 'محافظة صنعاء', code: 'GOV-SANAA' },
    { id: 'prov-ibb-001', name: 'محافظة إب', code: 'GOV-IBB' },
    { id: 'prov-hodeidah-001', name: 'محافظة الحديدة', code: 'GOV-HODEIDAH' },
  ];

  for (const p of provinces) {
    await prisma.province.upsert({
      where: { code: p.code },
      update: { name: p.name, centralCommandId: ministry.id, updatedAt: now() },
      create: { id: p.id, name: p.name, code: p.code, centralCommandId: ministry.id, updatedAt: now() },
    });
    console.log(`  ✅ Province: ${p.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEVEL 2: Level3Unit (per province)
  // ═══════════════════════════════════════════════════════════════════════

  // --- TAIZ ---
  const taizSecurityAdmin = await prisma.level3Unit.upsert({
    where: { code: 'TAIZ-SEC-ADMIN' },
    update: { name: 'إدارة أمن محافظة تعز', provinceId: 'prov-taiz-001', updatedAt: now() },
    create: {
      id: 'l3-taiz-sec-001', name: 'إدارة أمن محافظة تعز', code: 'TAIZ-SEC-ADMIN',
      unitType: 'SECURITY_ADMIN', provinceId: 'prov-taiz-001', updatedAt: now(),
    },
  });
  console.log(`    ✅ Level3: ${taizSecurityAdmin.name}`);

  const taizCivilDefense = await prisma.level3Unit.upsert({
    where: { code: 'TAIZ-CIVIL-DEF' },
    update: { name: 'الدفاع المدني — تعز', provinceId: 'prov-taiz-001', updatedAt: now() },
    create: {
      id: 'l3-taiz-civil-001', name: 'الدفاع المدني — تعز', code: 'TAIZ-CIVIL-DEF',
      unitType: 'CIVIL_DEFENSE', provinceId: 'prov-taiz-001', updatedAt: now(),
    },
  });
  console.log(`    ✅ Level3: ${taizCivilDefense.name}`);

  // --- ADEN ---
  const adenSecurityAdmin = await prisma.level3Unit.upsert({
    where: { code: 'ADEN-SEC-ADMIN' },
    update: { name: 'إدارة أمن محافظة عدن', provinceId: 'prov-aden-001', updatedAt: now() },
    create: {
      id: 'l3-aden-sec-001', name: 'إدارة أمن محافظة عدن', code: 'ADEN-SEC-ADMIN',
      unitType: 'SECURITY_ADMIN', provinceId: 'prov-aden-001', updatedAt: now(),
    },
  });
  console.log(`    ✅ Level3: ${adenSecurityAdmin.name}`);

  // --- HADRAMOUT ---
  const hadramoutSecurityAdmin = await prisma.level3Unit.upsert({
    where: { code: 'HAD-SEC-ADMIN' },
    update: { name: 'إدارة أمن محافظة حضرموت', provinceId: 'prov-hadramout-001', updatedAt: now() },
    create: {
      id: 'l3-had-sec-001', name: 'إدارة أمن محافظة حضرموت', code: 'HAD-SEC-ADMIN',
      unitType: 'SECURITY_ADMIN', provinceId: 'prov-hadramout-001', updatedAt: now(),
    },
  });
  console.log(`    ✅ Level3: ${hadramoutSecurityAdmin.name}`);

  // ═══════════════════════════════════════════════════════════════════════
  // LEVEL 3: Level4Department (under Level3)
  // ═══════════════════════════════════════════════════════════════════════

  const taizDepts = [
    { id: 'l4-taiz-cid-001', name: 'البحث الجنائي — تعز', code: 'TAIZ-CID', type: 'CRIMINAL_INVESTIGATION' },
    { id: 'l4-taiz-traffic-001', name: 'المرور — تعز', code: 'TAIZ-TRAFFIC', type: 'TRAFFIC' },
    { id: 'l4-taiz-passports-001', name: 'الجوازات — تعز', code: 'TAIZ-PASSPORTS', type: 'PASSPORTS' },
    { id: 'l4-taiz-narcotics-001', name: 'مكافحة المخدرات — تعز', code: 'TAIZ-NARCOTICS', type: 'NARCOTICS' },
    { id: 'l4-taiz-operations-001', name: 'العمليات — تعز', code: 'TAIZ-OPERATIONS', type: 'OPERATIONS' },
    { id: 'l4-taiz-evidence-001', name: 'الأدلة الجنائية — تعز', code: 'TAIZ-EVIDENCE', type: 'FORENSIC_EVIDENCE' },
  ];

  for (const d of taizDepts) {
    await prisma.level4Department.upsert({
      where: { code: d.code },
      update: { name: d.name, level3UnitId: taizSecurityAdmin.id, updatedAt: now() },
      create: { id: d.id, name: d.name, code: d.code, departmentType: d.type, level3UnitId: taizSecurityAdmin.id, updatedAt: now() },
    });
    console.log(`      ✅ Level4: ${d.name}`);
  }

  const adenDepts = [
    { id: 'l4-aden-cid-001', name: 'البحث الجنائي — عدن', code: 'ADEN-CID', type: 'CRIMINAL_INVESTIGATION' },
    { id: 'l4-aden-traffic-001', name: 'المرور — عدن', code: 'ADEN-TRAFFIC', type: 'TRAFFIC' },
    { id: 'l4-aden-passports-001', name: 'الجوازات — عدن', code: 'ADEN-PASSPORTS', type: 'PASSPORTS' },
  ];

  for (const d of adenDepts) {
    await prisma.level4Department.upsert({
      where: { code: d.code },
      update: { name: d.name, level3UnitId: adenSecurityAdmin.id, updatedAt: now() },
      create: { id: d.id, name: d.name, code: d.code, departmentType: d.type, level3UnitId: adenSecurityAdmin.id, updatedAt: now() },
    });
    console.log(`      ✅ Level4: ${d.name}`);
  }

  const hadDepts = [
    { id: 'l4-had-cid-001', name: 'البحث الجنائي — حضرموت', code: 'HAD-CID', type: 'CRIMINAL_INVESTIGATION' },
    { id: 'l4-had-traffic-001', name: 'المرور — حضرموت', code: 'HAD-TRAFFIC', type: 'TRAFFIC' },
  ];

  for (const d of hadDepts) {
    await prisma.level4Department.upsert({
      where: { code: d.code },
      update: { name: d.name, level3UnitId: hadramoutSecurityAdmin.id, updatedAt: now() },
      create: { id: d.id, name: d.name, code: d.code, departmentType: d.type, level3UnitId: hadramoutSecurityAdmin.id, updatedAt: now() },
    });
    console.log(`      ✅ Level4: ${d.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEVEL 4: Level5Section (under Level4)
  // ═══════════════════════════════════════════════════════════════════════

  const taizCidUnits = [
    { id: 'l5-taiz-inv-001', name: 'وحدة التحريات — تعز', code: 'TAIZ-CID-INV', type: 'INVESTIGATIONS' },
    { id: 'l5-taiz-evid-001', name: 'وحدة الأدلة — تعز', code: 'TAIZ-CID-EVID', type: 'EVIDENCE' },
  ];

  for (const u of taizCidUnits) {
    await prisma.level5Section.upsert({
      where: { code: u.code },
      update: { name: u.name, level4DepartmentId: 'l4-taiz-cid-001', updatedAt: now() },
      create: { id: u.id, name: u.name, code: u.code, sectionType: u.type, level4DepartmentId: 'l4-taiz-cid-001', updatedAt: now() },
    });
    console.log(`        ✅ Level5: ${u.name}`);
  }

  const adenCidUnits = [
    { id: 'l5-aden-inv-001', name: 'وحدة التحريات — عدن', code: 'ADEN-CID-INV', type: 'INVESTIGATIONS' },
  ];

  for (const u of adenCidUnits) {
    await prisma.level5Section.upsert({
      where: { code: u.code },
      update: { name: u.name, level4DepartmentId: 'l4-aden-cid-001', updatedAt: now() },
      create: { id: u.id, name: u.name, code: u.code, sectionType: u.type, level4DepartmentId: 'l4-aden-cid-001', updatedAt: now() },
    });
    console.log(`        ✅ Level5: ${u.name}`);
  }

  const hadCidUnits = [
    { id: 'l5-had-inv-001', name: 'وحدة التحريات — حضرموت', code: 'HAD-CID-INV', type: 'INVESTIGATIONS' },
  ];

  for (const u of hadCidUnits) {
    await prisma.level5Section.upsert({
      where: { code: u.code },
      update: { name: u.name, level4DepartmentId: 'l4-had-cid-001', updatedAt: now() },
      create: { id: u.id, name: u.name, code: u.code, sectionType: u.type, level4DepartmentId: 'l4-had-cid-001', updatedAt: now() },
    });
    console.log(`        ✅ Level5: ${u.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEVEL 5: Level6Unit (Police Stations under Level5)
  // ═══════════════════════════════════════════════════════════════════════

  const taizStations = [
    { id: 'l6-taiz-cairo-001', name: 'قسم شرطة القاهرة — تعز', code: 'TAIZ-PS-CAIRO', type: 'POLICE_STATION' },
    { id: 'l6-taiz-shamasi-001', name: 'قسم شرطة الشماسي — تعز', code: 'TAIZ-PS-SHAMASI', type: 'POLICE_STATION' },
  ];

  for (const s of taizStations) {
    await prisma.level6Unit.upsert({
      where: { code: s.code },
      update: { name: s.name, level5SectionId: 'l5-taiz-inv-001', updatedAt: now() },
      create: { id: s.id, name: s.name, code: s.code, unitType: s.type, level5SectionId: 'l5-taiz-inv-001', updatedAt: now() },
    });
    console.log(`          ✅ Level6: ${s.name}`);
  }

  const adenStations = [
    { id: 'l6-aden-khormaksar-001', name: 'قسم شرطة خور مكسر — عدن', code: 'ADEN-PS-KHORMAKSAR', type: 'POLICE_STATION' },
  ];

  for (const s of adenStations) {
    await prisma.level6Unit.upsert({
      where: { code: s.code },
      update: { name: s.name, level5SectionId: 'l5-aden-inv-001', updatedAt: now() },
      create: { id: s.id, name: s.name, code: s.code, unitType: s.type, level5SectionId: 'l5-aden-inv-001', updatedAt: now() },
    });
    console.log(`          ✅ Level6: ${s.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SAMPLE OFFICERS
  // ═══════════════════════════════════════════════════════════════════════

  const officers = [
    { id: 'officer-super-001', name: 'أحمد محمد الوزير', rank: 'لواء', role: 'SUPER_ADMIN', department: 'القيادة المركزية', accessLevel: 1 },
    { id: 'officer-gov-taiz-001', name: 'خالد عبدالله', rank: 'عميد', role: 'GOVERNORATE_ADMIN', department: 'إدارة أمن تعز', accessLevel: 2 },
    { id: 'officer-dept-taiz-cid-001', name: 'محمد علي', rank: 'عقيد', role: 'DEPARTMENT_HEAD', department: 'البحث الجنائي — تعز', accessLevel: 3 },
    { id: 'officer-unit-taiz-inv-001', name: 'سامي صالح', rank: 'مقدم', role: 'UNIT_HEAD', department: 'وحدة التحريات — تعز', accessLevel: 5 },
    { id: 'officer-officer-taiz-001', name: 'ناصر يحيى', rank: 'رائد', role: 'OFFICER', department: 'قسم شرطة القاهرة', accessLevel: 6 },
  ];

  for (const officer of officers) {
    await prisma.officer.upsert({
      where: { id: officer.id },
      update: { name: officer.name, rank: officer.rank, role: officer.role, department: officer.department, updatedAt: now() },
      create: {
        id: officer.id, name: officer.name, rank: officer.rank, role: officer.role,
        department: officer.department, accessLevel: officer.accessLevel, updatedAt: now(),
      },
    });
    console.log(`👤 Officer: ${officer.name} (${officer.role})`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEVEL ASSIGNMENTS
  //   Schema: @@unique([officerId, level, unitId]) → compound key: officerId_level_unitId
  // ═══════════════════════════════════════════════════════════════════════

  const assignments = [
    { officerId: 'officer-super-001', unitId: ministry.id, level: 0 },
    { officerId: 'officer-gov-taiz-001', unitId: 'prov-taiz-001', level: 1 },
    { officerId: 'officer-dept-taiz-cid-001', unitId: 'l4-taiz-cid-001', level: 3 },
    { officerId: 'officer-unit-taiz-inv-001', unitId: 'l5-taiz-inv-001', level: 4 },
    { officerId: 'officer-officer-taiz-001', unitId: 'l6-taiz-cairo-001', level: 5 },
  ];

  for (const a of assignments) {
    await prisma.levelAssignment.upsert({
      // Compound unique: officerId_level_unitId (matches @@unique field order)
      where: { officerId_level_unitId: { officerId: a.officerId, level: a.level, unitId: a.unitId } },
      update: { canView: true, canEdit: a.level <= 3, updatedAt: now() },
      create: {
        id: `la-${a.officerId}-${a.unitId}`,
        officerId: a.officerId,
        unitId: a.unitId,
        level: a.level,
        canView: true,
        canEdit: a.level <= 3,
        canDelete: a.level === 0,
        updatedAt: now(),
      },
    });
    console.log(`🔗 Assigned: ${a.officerId} → ${a.unitId} (Level ${a.level})`);
  }

  console.log('\n✅ NSSCP National Organizational Hierarchy seeded successfully!');
  console.log('══════════════════════════════════════════════');
  console.log('  6 Governorates');
  console.log('  4 Security Administrations (Level3)');
  console.log('  11 Departments (Level4)');
  console.log('  4 Sections/Units (Level5)');
  console.log('  3 Police Stations (Level6)');
  console.log('  5 Sample Officers with Hierarchy Assignments');
  console.log('══════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });