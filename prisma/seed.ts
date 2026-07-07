import { PrismaClient, HierarchyType, FieldType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================
// DATA: 22 Governorates of Yemen
// ============================================================
const GOVERNORATES = [
    { name: 'أمانة العاصمة', nameEn: 'Amanat Al Asimah', code: 'AMN' },
    { name: 'عدن', nameEn: 'Aden', code: 'ADN' },
    { name: 'صنعاء', nameEn: "Sana'a", code: 'SAN' },
    { name: 'تعز', nameEn: 'Taiz', code: 'TAI' },
    { name: 'الحديدة', nameEn: 'Al Hudaydah', code: 'HUD' },
    { name: 'حضرموت', nameEn: 'Hadramawt', code: 'HDN' },
    { name: 'إب', nameEn: 'Ibb', code: 'IBB' },
    { name: 'ذمار', nameEn: 'Dhamar', code: 'DHA' },
    { name: 'شبوة', nameEn: 'Shabwah', code: 'SHW' },
    { name: 'أبين', nameEn: 'Abyan', code: 'ABN' },
    { name: 'لحج', nameEn: 'Lahij', code: 'LAH' },
    { name: 'صعدة', nameEn: "Sa'dah", code: 'SAD' },
    { name: 'مأرب', nameEn: 'Marib', code: 'MAR' },
    { name: 'الجوف', nameEn: 'Al Jawf', code: 'JAW' },
    { name: 'البيضاء', nameEn: 'Al Bayda', code: 'BAY' },
    { name: 'حجة', nameEn: 'Hajjah', code: 'HAG' },
    { name: 'المهرة', nameEn: 'Al Mahrah', code: 'MHR' },
    { name: 'المحويت', nameEn: 'Al Mahwit', code: 'MWI' },
    { name: 'الضالع', nameEn: 'Ad Dali', code: 'DHL' },
    { name: 'عمران', nameEn: 'Amran', code: 'AMR' },
    { name: 'ريمة', nameEn: 'Raymah', code: 'RAY' },
    { name: 'سقطرى', nameEn: 'Socotra', code: 'SQT' },
] as const;

// ============================================================
// DATA: National-Level Main Departments (under Ministry directly)
// ============================================================
const NATIONAL_DEPARTMENTS = [
    { name: 'الإدارة العامة للبحث الجنائي', code: 'CRI', description: 'Criminal Investigation Department' },
    { name: 'الإدارة العامة للمرور', code: 'TRA', description: 'Traffic Department' },
    { name: 'الإدارة العامة للجوازات', code: 'PAS', description: 'Passports Department' },
    { name: 'الإدارة العامة لمكافحة المخدرات', code: 'NAR', description: 'Anti-Narcotics Department' },
    { name: 'الإدارة العامة للأمن السياسي', code: 'POL', description: 'Political Security Department' },
    { name: 'الإدارة العامة للأمن القومي', code: 'NAT', description: 'National Security Department' },
] as const;

// ============================================================
// DATA: Sections under each National Department
// ============================================================
const DEPARTMENT_SECTIONS: Record<string, Array<{ name: string; code: string }>> = {
    CRI: [
        { name: 'شعبة التحريات وجمع المعلومات', code: 'INT' },
        { name: 'شعبة مسرح الجريمة', code: 'SCE' },
        { name: 'شعبة المختبرات الجنائية', code: 'LAB' },
        { name: 'شعبة البصمات', code: 'FIN' },
    ],
    TRA: [
        { name: 'شعبة التراخيص', code: 'LIC' },
        { name: 'شعبة المخالفات', code: 'VIO' },
        { name: 'شعبة الحوادث', code: 'ACC' },
        { name: 'شعبة الفحص الفني', code: 'INS' },
    ],
    PAS: [
        { name: 'شعبة إصدار الجوازات', code: 'ISS' },
        { name: 'شعبة التجديد', code: 'REN' },
        { name: 'شعبة متابعة الوافدين', code: 'FOL' },
    ],
    NAR: [
        { name: 'شعبة المكافحة الميدانية', code: 'FLD' },
        { name: 'شعبة التوعية', code: 'AWA' },
        { name: 'شعبة التحليل والمعلومات', code: 'ANA' },
    ],
    POL: [
        { name: 'شعبة الرقابة', code: 'SUP' },
        { name: 'شعبة التحقيقات', code: 'INV' },
        { name: 'شعبة المتابعة', code: 'MON' },
    ],
    NAT: [
        { name: 'شعبة الأمن السيبراني', code: 'CYB' },
        { name: 'شعبة مكافحة التجسس', code: 'CTR' },
        { name: 'شعبة حماية الشخصيات', code: 'PRO' },
    ],
};

// ============================================================
// DATA: Units under each Section
// ============================================================
const SECTION_UNITS: Record<string, Array<{ name: string; code: string }>> = {
    INT: [
        { name: 'قسم المصادر البشرية', code: 'HUM' },
        { name: 'قسم المراقبة', code: 'SUR' },
        { name: 'قسم تحليل المعلومات', code: 'ANL' },
    ],
    SCE: [
        { name: 'قسم التوثيق', code: 'DOC' },
        { name: 'قسم رفع الأدلة', code: 'COL' },
        { name: 'قسم التصوير', code: 'PHO' },
    ],
    LIC: [
        { name: 'قسم إصدار الرخص', code: 'ISS' },
        { name: 'قسم تجديد الرخص', code: 'REN' },
    ],
    CYB: [
        { name: 'قسم أمن الشبكات', code: 'NET' },
        { name: 'قسم التحليل الرقمي', code: 'DIG' },
        { name: 'قسم الاستجابة', code: 'RES' },
    ],
    CTR: [
        { name: 'قسم التحري', code: 'INV' },
        { name: 'قسم الرقابة', code: 'MON' },
    ],
};

// ============================================================
// DATA: Governorate-level Departments (إدارات المحافظات)
// Each governorate has standard police departments
// ============================================================
const GOV_DEPARTMENT_CODES = ['OPS', 'INV', 'TRA', 'PAS', 'ADM'] as const;

const GOV_DEPARTMENTS: Array<{ name: string; code: string }> = [
    { name: 'إدارة العمليات', code: 'OPS' },
    { name: 'إدارة التحريات', code: 'INV' },
    { name: 'إدارة المرور', code: 'TRA' },
    { name: 'إدارة الجوازات', code: 'PAS' },
    { name: 'الإدارة المالية والإدارية', code: 'ADM' },
];

// ============================================================
// DATA: Sections under each Governorate Department
// ============================================================
const GOV_DEPT_SECTIONS: Record<string, Array<{ name: string; code: string }>> = {
    OPS: [
        { name: 'شعبة غرفة العمليات', code: 'OPS' },
        { name: 'شعبة التخطيط', code: 'PLN' },
    ],
    INV: [
        { name: 'شعبة البحث والتحري', code: 'INV' },
        { name: 'شعبة مسرح الجريمة', code: 'SCE' },
    ],
    TRA: [
        { name: 'شعبة التراخيص', code: 'LIC' },
        { name: 'شعبة الحوادث', code: 'ACC' },
    ],
    PAS: [
        { name: 'شعبة الإصدار', code: 'ISS' },
        { name: 'شعبة التجديد', code: 'REN' },
    ],
    ADM: [
        { name: 'شعبة الشؤون المالية', code: 'FIN' },
        { name: 'شعبة الشؤون الإدارية', code: 'ADM' },
    ],
};

// ============================================================
// DATA: Units under Governorate Sections
// ============================================================
const GOV_SECTION_UNITS: Record<string, Array<{ name: string; code: string }>> = {
    OPS: [
        { name: 'وحدة الاتصال', code: 'COM' },
        { name: 'وحدة المتابعة', code: 'FOL' },
    ],
    INV: [
        { name: 'وحدة جمع الاستدلالات', code: 'COL' },
        { name: 'وحدة التحقيق', code: 'INV' },
    ],
    FIN: [
        { name: 'وحدة الصرف', code: 'DIS' },
        { name: 'وحدة الإيرادات', code: 'REV' },
    ],
};

// ============================================================
// DATA: Permissions
// ============================================================
const PERMISSIONS = [
    { name: 'users.read', module: 'users', action: 'read', description: 'قراءة المستخدمين' },
    { name: 'users.create', module: 'users', action: 'create', description: 'إنشاء مستخدمين' },
    { name: 'users.update', module: 'users', action: 'update', description: 'تعديل المستخدمين' },
    { name: 'users.delete', module: 'users', action: 'delete', description: 'حذف المستخدمين' },
    { name: 'roles.read', module: 'roles', action: 'read', description: 'قراءة الأدوار' },
    { name: 'roles.create', module: 'roles', action: 'create', description: 'إنشاء أدوار' },
    { name: 'roles.update', module: 'roles', action: 'update', description: 'تعديل الأدوار' },
    { name: 'roles.delete', module: 'roles', action: 'delete', description: 'حذف الأدوار' },
    { name: 'permissions.read', module: 'permissions', action: 'read', description: 'قراءة الصلاحيات' },
    { name: 'permissions.assign', module: 'permissions', action: 'assign', description: 'تعيين الصلاحيات' },
    { name: 'hierarchy.read', module: 'hierarchy', action: 'read', description: 'قراءة الهيكل التنظيمي' },
    { name: 'hierarchy.create', module: 'hierarchy', action: 'create', description: 'إنشاء كيان هيكلي' },
    { name: 'hierarchy.update', module: 'hierarchy', action: 'update', description: 'تعديل الهيكل التنظيمي' },
    { name: 'hierarchy.delete', module: 'hierarchy', action: 'delete', description: 'حذف كيان هيكلي' },
    { name: 'cases.read', module: 'cases', action: 'read', description: 'قراءة القضايا' },
    { name: 'cases.create', module: 'cases', action: 'create', description: 'إنشاء قضية' },
    { name: 'cases.update', module: 'cases', action: 'update', description: 'تعديل القضايا' },
    { name: 'cases.delete', module: 'cases', action: 'delete', description: 'حذف القضايا' },
    { name: 'cases.assign', module: 'cases', action: 'assign', description: 'تعيين قضايا' },
    { name: 'officers.read', module: 'officers', action: 'read', description: 'قراءة الضباط' },
    { name: 'officers.create', module: 'officers', action: 'create', description: 'إنشاء ضابط' },
    { name: 'officers.update', module: 'officers', action: 'update', description: 'تعديل الضباط' },
    { name: 'officers.delete', module: 'officers', action: 'delete', description: 'حذف الضباط' },
    { name: 'evidence.read', module: 'evidence', action: 'read', description: 'قراءة الأدلة' },
    { name: 'evidence.create', module: 'evidence', action: 'create', description: 'إضافة دليل' },
    { name: 'evidence.update', module: 'evidence', action: 'update', description: 'تعديل الأدلة' },
    { name: 'evidence.delete', module: 'evidence', action: 'delete', description: 'حذف الأدلة' },
    { name: 'archive.read', module: 'archive', action: 'read', description: 'قراءة الأرشيف' },
    { name: 'archive.create', module: 'archive', action: 'create', description: 'إضافة إلى الأرشيف' },
    { name: 'archive.delete', module: 'archive', action: 'delete', description: 'حذف من الأرشيف' },
    { name: 'operations.read', module: 'operations', action: 'read', description: 'قراءة العمليات' },
    { name: 'operations.create', module: 'operations', action: 'create', description: 'إنشاء عملية' },
    { name: 'operations.update', module: 'operations', action: 'update', description: 'تعديل العمليات' },
    { name: 'wanted.read', module: 'wanted', action: 'read', description: 'قراءة المطلوبين' },
    { name: 'wanted.create', module: 'wanted', action: 'create', description: 'إضافة مطلوب' },
    { name: 'wanted.update', module: 'wanted', action: 'update', description: 'تعديل المطلوبين' },
    { name: 'wanted.delete', module: 'wanted', action: 'delete', description: 'حذف مطلوب' },
    { name: 'reports.read', module: 'reports', action: 'read', description: 'قراءة التقارير' },
    { name: 'reports.create', module: 'reports', action: 'create', description: 'إنشاء تقرير' },
    { name: 'reports.export', module: 'reports', action: 'export', description: 'تصدير التقارير' },
    { name: 'settings.read', module: 'settings', action: 'read', description: 'قراءة الإعدادات' },
    { name: 'settings.update', module: 'settings', action: 'update', description: 'تعديل الإعدادات' },
    { name: 'audit.read', module: 'audit', action: 'read', description: 'قراءة سجل التدقيق' },
    { name: 'prisons.read', module: 'prisons', action: 'read', description: 'قراءة السجون' },
    { name: 'prisons.create', module: 'prisons', action: 'create', description: 'إنشاء سجن' },
    { name: 'prisons.update', module: 'prisons', action: 'update', description: 'تعديل السجون' },
    { name: 'traffic.read', module: 'traffic', action: 'read', description: 'قراءة المرور' },
    { name: 'traffic.create', module: 'traffic', action: 'create', description: 'إنشاء مخالفة' },
    { name: 'traffic.update', module: 'traffic', action: 'update', description: 'تعديل المخالفات' },
    { name: 'circulars.read', module: 'circulars', action: 'read', description: 'قراءة النشرات' },
    { name: 'circulars.create', module: 'circulars', action: 'create', description: 'إنشاء نشرة' },
    { name: 'forms.read', module: 'forms', action: 'read', description: 'قراءة النماذج الديناميكية' },
    { name: 'forms.create', module: 'forms', action: 'create', description: 'إنشاء نموذج' },
    { name: 'forms.update', module: 'forms', action: 'update', description: 'تعديل النماذج' },
    { name: 'records.create', module: 'records', action: 'create', description: 'إنشاء سجل' },
    { name: 'records.read', module: 'records', action: 'read', description: 'قراءة السجلات' },
    { name: 'emergency.manage', module: 'emergency', action: 'manage', description: 'إدارة الطوارئ' },
    { name: 'patrols.manage', module: 'patrols', action: 'manage', description: 'إدارة الدوريات' },
    { name: 'notifications.send', module: 'notifications', action: 'send', description: 'إرسال الإشعارات' },
] as const;

// ============================================================
// DATA: Roles
// ============================================================
const ROLES = [
    { name: 'SUPER_ADMIN', description: 'مدير النظام - صلاحية كاملة على النظام', isSystem: true },
    { name: 'MINISTRY_ADMIN', description: 'مدير في الوزارة - إدارة على مستوى الوزارة', isSystem: true },
    { name: 'GOVERNORATE_ADMIN', description: 'مدير محافظة - إدارة على مستوى المحافظة', isSystem: true },
    { name: 'DEPARTMENT_HEAD', description: 'رئيس قسم - إدارة على مستوى القسم', isSystem: true },
    { name: 'SECTION_HEAD', description: 'رئيس شعبة', isSystem: true },
    { name: 'UNIT_HEAD', description: 'رئيس وحدة', isSystem: true },
    { name: 'OFFICER', description: 'ضابط عادي', isSystem: true },
    { name: 'VIEWER', description: 'مشاهد فقط', isSystem: true },
] as const;

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function main() {
    console.log('🚀 ============================================');
    console.log('🚀  NSSCP Complete Seed Initialization');
    console.log('🚀  Ministry of Interior — National Security');
    console.log('🚀 ============================================\n');

    const startTime = Date.now();

    // Track operations for summary
    const summary = {
        created: 0,
        updated: 0,
        skipped: 0,
        deleted: 0,
    };

    try {
        // --------------------------------------------------
        // STEP 0: CLEANUP — Fix incorrectly typed entities before creating hierarchy
        // --------------------------------------------------
        console.log('📌 STEP 0: Cleaning up incorrectly typed hierarchy entities');
        console.log('   🔍 Scanning for entities that need reclassification...');

        // National department codes that should be preserved
        const nationalDeptCodes = new Set(NATIONAL_DEPARTMENTS.map(d => `MOI-${d.code}`));

        // Find all entries with codes like GOV-XXX-YYYY (governorate sections typed as DEPARTMENT)
        // These were incorrectly inserted as DEPARTMENT but should be SECTION
        // Pattern: GOV-XXX-YYY where XXX is governorate code and YYY is department-like suffix
        const allEntities = await prisma.hierarchyEntity.findMany({
            select: { id: true, code: true, type: true, parentId: true },
        });

        let reclassifiedCount = 0;
        let deletedCount = 0;

        for (const entity of allEntities) {
            const code = entity.code;

            // Skip national departments (MOI-*) and known good entities
            if (nationalDeptCodes.has(code)) continue;
            if (code === 'MOI-ROOT') continue;

            // Case 1: Codes matching GOV-XXX-YYYY — these are governorate sections incorrectly typed as DEPARTMENT
            // Should be reclassified to SECTION
            if (code.startsWith('GOV-') && entity.type === HierarchyType.DEPARTMENT) {
                // Check if it's a 3-part code: GOV-XXX-YYYY
                const parts = code.split('-');
                if (parts.length >= 3) {
                    const govCode = parts[1];
                    // Verify this govCode is a real governorate
                    const isValidGov = GOVERNORATES.some(g => g.code === govCode);
                    if (isValidGov) {
                        console.log(`   🔄 Reclassifying ${code}: ${HierarchyType.DEPARTMENT} → ${HierarchyType.SECTION}`);
                        await prisma.hierarchyEntity.update({
                            where: { id: entity.id },
                            data: { type: HierarchyType.SECTION },
                        });
                        reclassifiedCount++;
                    }
                }
            }
        }

        // Case 2: Find and delete any duplicate MOI-* department entities that are not in our national list
        // (e.g., MOI-OPS, MOI-INV that might have been inserted as duplicates)
        for (const entity of allEntities) {
            const code = entity.code;
            if (code.startsWith('MOI-') && code !== 'MOI-ROOT' && !nationalDeptCodes.has(code) && !code.includes('-SEC-') && !code.includes('-UNT-')) {
                if (entity.type === HierarchyType.DEPARTMENT) {
                    console.log(`   🗑️  Deleting duplicate/wrong department: ${code}`);
                    await prisma.hierarchyEntity.delete({ where: { id: entity.id } });
                    deletedCount++;
                }
            }
        }

        console.log(`   ✅ Reclassified: ${reclassifiedCount} entities`);
        console.log(`   ✅ Deleted: ${deletedCount} entities\n`);
        
        summary.updated += reclassifiedCount;
        summary.deleted += deletedCount;

        // --------------------------------------------------
        // STEP 1: Create Roles
        // --------------------------------------------------
        console.log('📌 STEP 1: Creating Roles');
        const createdRoles: Record<string, string> = {};

        for (const roleData of ROLES) {
            const existing = await prisma.role.findUnique({ where: { name: roleData.name } });
            const role = await prisma.role.upsert({
                where: { name: roleData.name },
                update: {
                    description: roleData.description,
                    isSystem: roleData.isSystem,
                },
                create: {
                    name: roleData.name,
                    description: roleData.description,
                    isSystem: roleData.isSystem,
                },
            });
            createdRoles[roleData.name] = role.id;
            
            if (existing) {
                summary.updated++;
                console.log(`   🔄 Role: ${role.name} (updated)`);
            } else {
                summary.created++;
                console.log(`   ✅ Role: ${role.name} (created)`);
            }
        }
        console.log(`   ✅ ${Object.keys(createdRoles).length} roles processed\n`);

        // --------------------------------------------------
        // STEP 2: Create Permissions
        // --------------------------------------------------
        console.log('📌 STEP 2: Creating Permissions');
        const createdPermissions: Record<string, string> = {};

        for (const permData of PERMISSIONS) {
            const existing = await prisma.permission.findUnique({ where: { name: permData.name } });
            const perm = await prisma.permission.upsert({
                where: { name: permData.name },
                update: {
                    description: permData.description,
                    module: permData.module,
                    action: permData.action,
                },
                create: {
                    name: permData.name,
                    description: permData.description,
                    module: permData.module,
                    action: permData.action,
                },
            });
            createdPermissions[permData.name] = perm.id;
            
            if (existing) {
                summary.updated++;
            } else {
                summary.created++;
            }
        }
        console.log(`   ✅ ${Object.keys(createdPermissions).length} permissions processed\n`);

        // --------------------------------------------------
        // STEP 3: Assign all permissions to SUPER_ADMIN
        // --------------------------------------------------
        console.log('📌 STEP 3: Assigning Permissions to SUPER_ADMIN Role');

        for (const permData of PERMISSIONS) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: createdRoles['SUPER_ADMIN'],
                        permissionId: createdPermissions[permData.name],
                    },
                },
                update: { granted: true },
                create: {
                    roleId: createdRoles['SUPER_ADMIN'],
                    permissionId: createdPermissions[permData.name],
                    granted: true,
                },
            });
        }
        console.log(`   ✅ All ${Object.keys(createdPermissions).length} permissions assigned to SUPER_ADMIN\n`);

        // --------------------------------------------------
        // STEP 4: Create Ministry of Interior Root
        // --------------------------------------------------
        console.log('📌 STEP 4: Creating Hierarchy Root — Ministry of Interior');

        const ministry = await prisma.hierarchyEntity.upsert({
            where: { code: 'MOI-ROOT' },
            update: { name: 'وزارة الداخلية', type: HierarchyType.MINISTRY },
            create: {
                name: 'وزارة الداخلية',
                code: 'MOI-ROOT',
                type: HierarchyType.MINISTRY,
            },
        });
        console.log(`   ✅ Ministry: ${ministry.name} (${ministry.code})\n`);

        // --------------------------------------------------
        // STEP 5: Create National-Level Main Departments under Ministry
        // --------------------------------------------------
        console.log('📌 STEP 5: Creating National-Level Main Departments');

        const nationalDeptIds: Record<string, string> = {};

        for (const dept of NATIONAL_DEPARTMENTS) {
            const deptCode = `MOI-${dept.code}`;
            const ent = await prisma.hierarchyEntity.upsert({
                where: { code: deptCode },
                update: {
                    name: dept.name,
                    type: HierarchyType.DEPARTMENT,
                    parentId: ministry.id,
                },
                create: {
                    name: dept.name,
                    code: deptCode,
                    type: HierarchyType.DEPARTMENT,
                    parentId: ministry.id,
                },
            });
            nationalDeptIds[dept.code] = ent.id;
            console.log(`   ✅ ${dept.name} (${deptCode})`);
        }
        console.log(`   ✅ ${Object.keys(nationalDeptIds).length} national departments created\n`);

        // --------------------------------------------------
        // STEP 6: Create Sections under National Departments
        // --------------------------------------------------
        console.log('📌 STEP 6: Creating Sections under National Departments');
        let sectionCount = 0;
        const createdSectionIds: Record<string, string> = {};

        for (const [deptCode, sections] of Object.entries(DEPARTMENT_SECTIONS)) {
            const parentId = nationalDeptIds[deptCode];
            if (!parentId) continue;

            for (const section of sections) {
                const sectionCode = `MOI-${deptCode}-SEC-${section.code}`;
                const ent = await prisma.hierarchyEntity.upsert({
                    where: { code: sectionCode },
                    update: {
                        name: section.name,
                        type: HierarchyType.SECTION,
                        parentId: parentId,
                    },
                    create: {
                        name: section.name,
                        code: sectionCode,
                        type: HierarchyType.SECTION,
                        parentId: parentId,
                    },
                });
                createdSectionIds[`${deptCode}-${section.code}`] = ent.id;
                sectionCount++;
                console.log(`   ✅ Section: ${section.name} (${sectionCode})`);
            }
        }
        console.log(`   ✅ ${sectionCount} national-level sections created\n`);

        // --------------------------------------------------
        // STEP 7: Create Units under National Sections
        // --------------------------------------------------
        console.log('📌 STEP 7: Creating Units under National Sections');
        let unitCount = 0;

        for (const [sectionKey, units] of Object.entries(SECTION_UNITS)) {
            const parentId = createdSectionIds[sectionKey];
            if (!parentId) continue;

            for (const unit of units) {
                const unitCode = `MOI-${sectionKey}-UNT-${unit.code}`;
                await prisma.hierarchyEntity.upsert({
                    where: { code: unitCode },
                    update: {
                        name: unit.name,
                        type: HierarchyType.UNIT,
                        parentId: parentId,
                    },
                    create: {
                        name: unit.name,
                        code: unitCode,
                        type: HierarchyType.UNIT,
                        parentId: parentId,
                    },
                });
                unitCount++;
                console.log(`   ✅ Unit: ${unit.name} (${unitCode})`);
            }
        }
        console.log(`   ✅ ${unitCount} national-level units created\n`);

        // --------------------------------------------------
        // STEP 8: Create All 22 Governorates under Ministry
        // --------------------------------------------------
        console.log('📌 STEP 8: Creating 22 Governorates');

        const govIds: Record<string, string> = {};

        for (const gov of GOVERNORATES) {
            const govCode = `GOV-${gov.code}`;
            const ent = await prisma.hierarchyEntity.upsert({
                where: { code: govCode },
                update: {
                    name: gov.name,
                    type: HierarchyType.GOVERNORATE,
                    parentId: ministry.id,
                },
                create: {
                    name: gov.name,
                    code: govCode,
                    type: HierarchyType.GOVERNORATE,
                    parentId: ministry.id,
                },
            });
            govIds[gov.code] = ent.id;
            console.log(`   ✅ Governorate: ${gov.name} (${govCode})`);
        }
        console.log(`   ✅ ${GOVERNORATES.length} governorates created\n`);

        // --------------------------------------------------
        // STEP 9: Create Departments under each Governorate
        // --------------------------------------------------
        console.log('📌 STEP 9: Creating Departments under Governorates');

        const govDeptIds: Record<string, string> = {};
        let govDeptCount = 0;

        for (const gov of GOVERNORATES) {
            const govId = govIds[gov.code];
            if (!govId) continue;

            for (const dept of GOV_DEPARTMENTS) {
                const deptCode = `GOV-${gov.code}-DEPT-${dept.code}`;
                const ent = await prisma.hierarchyEntity.upsert({
                    where: { code: deptCode },
                    update: {
                        name: dept.name,
                        type: HierarchyType.DEPARTMENT,
                        parentId: govId,
                    },
                    create: {
                        name: dept.name,
                        code: deptCode,
                        type: HierarchyType.DEPARTMENT,
                        parentId: govId,
                    },
                });
                const key = `${gov.code}-${dept.code}`;
                govDeptIds[key] = ent.id;
                govDeptCount++;
                console.log(`   ✅ ${gov.name} → ${dept.name} (${deptCode})`);
            }
        }
        console.log(`   ✅ ${govDeptCount} governorate departments created\n`);

        // --------------------------------------------------
        // STEP 10: Create Sections under each Governorate Department
        // --------------------------------------------------
        console.log('📌 STEP 10: Creating Sections under Governorate Departments');

        let govSectionCount = 0;
        const govSectionIds: Record<string, string> = {};

        for (const gov of GOVERNORATES) {
            for (const dept of GOV_DEPARTMENTS) {
                const deptKey = `${gov.code}-${dept.code}`;
                const deptId = govDeptIds[deptKey];
                if (!deptId) continue;

                const sections = GOV_DEPT_SECTIONS[dept.code];
                if (!sections) continue;

                for (const section of sections) {
                    const sectionCode = `GOV-${gov.code}-SEC-${dept.code}-${section.code}`;
                    const ent = await prisma.hierarchyEntity.upsert({
                        where: { code: sectionCode },
                        update: {
                            name: section.name,
                            type: HierarchyType.SECTION,
                            parentId: deptId,
                        },
                        create: {
                            name: section.name,
                            code: sectionCode,
                            type: HierarchyType.SECTION,
                            parentId: deptId,
                        },
                    });
                    const sectionKey = `${gov.code}-${dept.code}-${section.code}`;
                    govSectionIds[sectionKey] = ent.id;
                    govSectionCount++;
                    console.log(`   ✅ Section: ${section.name} (${sectionCode})`);
                }
            }
        }
        console.log(`   ✅ ${govSectionCount} governorate sections created\n`);

        // --------------------------------------------------
        // STEP 11: Create Units under Governorate Sections
        // --------------------------------------------------
        console.log('📌 STEP 11: Creating Units under Governorate Sections');

        let govUnitCount = 0;

        for (const gov of GOVERNORATES) {
            for (const dept of GOV_DEPARTMENTS) {
                const sections = GOV_DEPT_SECTIONS[dept.code];
                if (!sections) continue;

                for (const section of sections) {
                    const sectionKey = `${gov.code}-${dept.code}-${section.code}`;
                    const sectionId = govSectionIds[sectionKey];
                    if (!sectionId) continue;

                    const units = GOV_SECTION_UNITS[section.code];
                    if (!units) continue;

                    for (const unit of units) {
                        const unitCode = `GOV-${gov.code}-UNT-${dept.code}-${section.code}-${unit.code}`;
                        await prisma.hierarchyEntity.upsert({
                            where: { code: unitCode },
                            update: {
                                name: unit.name,
                                type: HierarchyType.UNIT,
                                parentId: sectionId,
                            },
                            create: {
                                name: unit.name,
                                code: unitCode,
                                type: HierarchyType.UNIT,
                                parentId: sectionId,
                            },
                        });
                        govUnitCount++;
                        console.log(`   ✅ Unit: ${unit.name} (${unitCode})`);
                    }
                }
            }
        }
        console.log(`   ✅ ${govUnitCount} governorate units created\n`);

        unitCount += govUnitCount;

        // --------------------------------------------------
        // STEP 12: Create DynamicForms for Department, Section, Unit
        // --------------------------------------------------
        console.log('📌 STEP 12: Creating DynamicForms for Department, Section, Unit');

        // We need to find representative entities of each type to attach forms to
        const firstDept = await prisma.hierarchyEntity.findFirst({
            where: { type: HierarchyType.DEPARTMENT, parentId: { not: null } },
            orderBy: { code: 'asc' },
        });

        const firstSection = await prisma.hierarchyEntity.findFirst({
            where: { type: HierarchyType.SECTION, parentId: { not: null } },
            orderBy: { code: 'asc' },
        });

        const firstUnit = await prisma.hierarchyEntity.findFirst({
            where: { type: HierarchyType.UNIT, parentId: { not: null } },
            orderBy: { code: 'asc' },
        });

        // Department DynamicForm
        if (firstDept) {
            await prisma.dynamicForm.upsert({
                where: { code: 'FORM-DEPT-GENERAL' },
                update: {
                    name: 'نموذج الإدارة العام',
                    description: 'نموذج عام لإدارات وأقسام الشرطة',
                    isActive: true,
                    hierarchyEntityId: firstDept.id,
                },
                create: {
                    name: 'نموذج الإدارة العام',
                    code: 'FORM-DEPT-GENERAL',
                    description: 'نموذج عام لإدارات وأقسام الشرطة',
                    isActive: true,
                    hierarchyEntityId: firstDept.id,
                },
            });
            console.log('   ✅ DynamicForm for DEPARTMENT created/updated');
        }

        // Section DynamicForm
        if (firstSection) {
            await prisma.dynamicForm.upsert({
                where: { code: 'FORM-SEC-GENERAL' },
                update: {
                    name: 'نموذج الشعبة العام',
                    description: 'نموذج عام لشعب الشرطة',
                    isActive: true,
                    hierarchyEntityId: firstSection.id,
                },
                create: {
                    name: 'نموذج الشعبة العام',
                    code: 'FORM-SEC-GENERAL',
                    description: 'نموذج عام لشعب الشرطة',
                    isActive: true,
                    hierarchyEntityId: firstSection.id,
                },
            });
            console.log('   ✅ DynamicForm for SECTION created/updated');
        }

        // Unit DynamicForm
        if (firstUnit) {
            await prisma.dynamicForm.upsert({
                where: { code: 'FORM-UNT-GENERAL' },
                update: {
                    name: 'نموذج الوحدة العام',
                    description: 'نموذج عام لوحدات الشرطة',
                    isActive: true,
                    hierarchyEntityId: firstUnit.id,
                },
                create: {
                    name: 'نموذج الوحدة العام',
                    code: 'FORM-UNT-GENERAL',
                    description: 'نموذج عام لوحدات الشرطة',
                    isActive: true,
                    hierarchyEntityId: firstUnit.id,
                },
            });
            console.log('   ✅ DynamicForm for UNIT created/updated');
        }

        if (!firstDept || !firstSection || !firstUnit) {
            console.log('   ⚠️ Some hierarchy entities not yet available for DynamicForm creation');
        }
        console.log(`\n`);

        // --------------------------------------------------
        // STEP 13: Create SUPER_ADMIN User
        // --------------------------------------------------
        console.log('📌 STEP 13: Creating SUPER_ADMIN User');

        const hashedPassword = await bcrypt.hash('Admin@123456', 12);

        const superAdminUser = await prisma.user.upsert({
            where: { username: 'super_admin' },
            update: {
                fullName: 'مدير النظام - وزارة الداخلية',
                isActive: true,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
            },
            create: {
                username: 'super_admin',
                password: hashedPassword,
                fullName: 'مدير النظام - وزارة الداخلية',
                role: 'SUPER_ADMIN',
                militaryNumber: 'MOI-00001',
                rank: 'لواء',
                position: 'مدير النظام',
                province: 'أمانة العاصمة',
                department: 'وزارة الداخلية',
                email: 'superadmin@moi.gov.ye',
                phoneNumber: '01-1111111',
                isActive: true,
            },
        });

        console.log(`   ✅ SUPER_ADMIN user created:`);
        console.log(`      Username:     ${superAdminUser.username}`);
        console.log(`      Full Name:    ${superAdminUser.fullName}`);
        console.log(`      Password:     Admin@123456`);
        console.log(`      Email:        ${superAdminUser.email}`);
        console.log(`      Military No.: ${superAdminUser.militaryNumber}\n`);

        // --------------------------------------------------
        // STEP 14: Assign SUPER_ADMIN role and all permissions to user
        // --------------------------------------------------
        console.log('📌 STEP 14: Assigning Permissions to SUPER_ADMIN User');

        for (const permData of PERMISSIONS) {
            await prisma.userPermission.upsert({
                where: {
                    userId_permissionId: {
                        userId: superAdminUser.id,
                        permissionId: createdPermissions[permData.name],
                    },
                },
                update: { granted: true, roleId: createdRoles['SUPER_ADMIN'] },
                create: {
                    userId: superAdminUser.id,
                    permissionId: createdPermissions[permData.name],
                    granted: true,
                    roleId: createdRoles['SUPER_ADMIN'],
                },
            });
        }
        console.log(`   ✅ All permissions assigned to SUPER_ADMIN user\n`);

        // --------------------------------------------------
        // STEP 15: Assign SUPER_ADMIN user to Ministry hierarchy
        // --------------------------------------------------
        console.log('📌 STEP 15: Assigning SUPER_ADMIN to Ministry Hierarchy');

        await prisma.hierarchyUser.upsert({
            where: {
                userId_hierarchyEntityId: {
                    userId: superAdminUser.id,
                    hierarchyEntityId: ministry.id,
                },
            },
            update: { role: 'SUPER_ADMIN', isPrimary: true },
            create: {
                userId: superAdminUser.id,
                hierarchyEntityId: ministry.id,
                role: 'SUPER_ADMIN',
                isPrimary: true,
            },
        });
        console.log(`   ✅ SUPER_ADMIN assigned to Ministry hierarchy\n`);

        // --------------------------------------------------
        // SUMMARY
        // --------------------------------------------------
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        const totalEntities = await prisma.hierarchyEntity.count();
        const totalRoles = await prisma.role.count();
        const totalPermissions = await prisma.permission.count();
        const totalUsers = await prisma.user.count();
        const totalDepartments = await prisma.hierarchyEntity.count({ where: { type: HierarchyType.DEPARTMENT } });
        const totalSections = await prisma.hierarchyEntity.count({ where: { type: HierarchyType.SECTION } });
        const totalUnits = await prisma.hierarchyEntity.count({ where: { type: HierarchyType.UNIT } });
        const totalGovernorates = await prisma.hierarchyEntity.count({ where: { type: HierarchyType.GOVERNORATE } });
        const totalDynamicForms = await prisma.dynamicForm.count();

        // Count national departments specifically (MOI-* pattern excluding MOI-ROOT)
        const totalNationalDepts = await prisma.hierarchyEntity.count({
            where: {
                type: HierarchyType.DEPARTMENT,
                parentId: ministry.id,
            },
        });

        console.log('🎉 ============================================');
        console.log('🎉  SEED COMPLETED SUCCESSFULLY');
        console.log('🎉 ============================================');
        console.log(`   ⏱  Duration: ${duration} seconds`);
        console.log('');
        console.log('📊 OPERATION SUMMARY:');
        console.log(`   ✅ Created: ${summary.created} records`);
        console.log(`   🔄 Updated: ${summary.updated} records`);
        console.log(`   ⏭️  Skipped: ${summary.skipped} records`);
        console.log(`   🗑️  Deleted: ${summary.deleted} records`);
        console.log('');
        console.log('📈 DATABASE TOTALS:');
        console.log(`   🏢 Total Hierarchy Entities: ${totalEntities}`);
        console.log(`   🏛  Ministry: 1`);
        console.log(`   📍 Governorates: ${totalGovernorates}`);
        console.log(`   🏛  National Departments: ${totalNationalDepts}`);
        console.log(`   📂 Governorate Departments: ${totalDepartments - totalNationalDepts}`);
        console.log(`   📂 Total Departments: ${totalDepartments}`);
        console.log(`   📑 Sections: ${totalSections}`);
        console.log(`   📁 Units: ${totalUnits}`);
        console.log(`   📋 DynamicForms: ${totalDynamicForms}`);
        console.log(`   👤 Users: ${totalUsers}`);
        console.log(`   🔐 Roles: ${totalRoles}`);
        console.log(`   🔑 Permissions: ${totalPermissions}`);
        console.log('');
        console.log('🔐 SUPER_ADMIN LOGIN CREDENTIALS:');
        console.log('   Username: super_admin');
        console.log('   Password: Admin@123456');
        console.log('   Email: superadmin@moi.gov.ye');
        console.log('');
        console.log('🏛  MAIN DEPARTMENTS SEEDED:');
        console.log('   ✅ البحث الجنائي (Criminal Investigation)');
        console.log('   ✅ المرور (Traffic)');
        console.log('   ✅ الجوازات (Passports)');
        console.log('   ✅ مكافحة المخدرات (Anti-Narcotics)');
        console.log('   ✅ الأمن السياسي (Political Security)');
        console.log('   ✅ الأمن القومي (National Security)');
        console.log('');
        console.log('✨ SEED IS IDEMPOTENT - Safe to run multiple times!');
        console.log('');

    } catch (error) {
        console.error('❌ ============================================');
        console.error('❌  SEED FAILED');
        console.error('❌ ============================================');
        console.error('   Error:', error instanceof Error ? error.message : error);
        console.error('   Stack:', error instanceof Error ? error.stack : 'N/A');
        throw error;
    }
}

// ============================================================
// EXECUTION
// ============================================================
main()
    .then(async () => {
        await prisma.$disconnect();
        console.log('✅ Database connection closed.');
        process.exit(0);
    })
    .catch(async (error) => {
        console.error('\n❌ Fatal error during seeding:', error);
        await prisma.$disconnect();
        process.exit(1);
    });