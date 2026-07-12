// ============================================================================
// NSSCP — Wanted Persons Advanced Seed
// متوافق 100% مع schema.prisma الحالي (Legacy WantedPerson)
// ============================================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚔 Seeding wanted persons database...\n')

  const wantedPersons = [
    {
      fullName: 'أحمد محمد علي',
      identityNumber: 'W1001-001',
      nationality: 'يمني',
      chargeDetails: 'جرائم قتل — 3 ضحايا في عدن 2024',
      issuingProvince: 'عدن',
      dangerLevel: 'عالي جداً',
      status: 'مطلوب حياً',
    },
    {
      fullName: 'خالد عبد الله صالح',
      identityNumber: 'W1001-002',
      nationality: 'يمني',
      chargeDetails: 'تهريب أسلحة وتمويل أنشطة إرهابية',
      issuingProvince: 'مأرب',
      dangerLevel: 'عالي',
      status: 'مطلوب حياً',
    },
    {
      fullName: 'محمد حسن ناصر',
      identityNumber: 'W1001-003',
      nationality: 'يمني',
      chargeDetails: 'جرائم إلكترونية — اختراق أنظمة بنكية',
      issuingProvince: 'عدن',
      dangerLevel: 'عالي جداً',
      status: 'مطلوب حياً',
    },
    {
      fullName: 'علي عمر سعيد',
      identityNumber: 'W1001-004',
      nationality: 'يمني',
      chargeDetails: 'تهريب مخدرات عبر الحدود البحرية',
      issuingProvince: 'حضرموت',
      dangerLevel: 'عالي',
      status: 'مطلوب حياً',
    },
    {
      fullName: 'سامية علي محمد',
      identityNumber: 'W1001-005',
      nationality: 'يمني',
      chargeDetails: 'تزوير وثائق رسمية وجوازات سفر',
      issuingProvince: 'صنعاء',
      dangerLevel: 'متوسط',
      status: 'مطلوب حياً',
    },
    {
      fullName: 'فهد سالم باعمر',
      identityNumber: 'W1001-006',
      nationality: 'يمني',
      chargeDetails: 'سرقة بالإكراه وسطو مسلح على بنوك',
      issuingProvince: 'حضرموت',
      dangerLevel: 'عالي جداً',
      status: 'مطلوب حياً',
    },
    {
      fullName: 'يوسف أحمد الحمادي',
      identityNumber: 'W1001-007',
      nationality: 'يمني',
      chargeDetails: 'الانتماء لتنظيمات إرهابية — تجنيد عناصر',
      issuingProvince: 'أبين',
      dangerLevel: 'عالي جداً',
      status: 'مطلوب حياً',
    },
    {
      fullName: 'نبيلة قاسم العريقي',
      identityNumber: 'W1001-008',
      nationality: 'يمني',
      chargeDetails: 'غسيل أموال — تحويلات مالية مشبوهة',
      issuingProvince: 'تعز',
      dangerLevel: 'عالي',
      status: 'مطلوب حياً',
    },
    {
      fullName: 'عادل منصور الحميري',
      identityNumber: 'W1001-009',
      nationality: 'يمني',
      chargeDetails: 'اختطاف وطلب فدية — 5 قضايا',
      issuingProvince: 'مأرب',
      dangerLevel: 'عالي جداً',
      status: 'مقبوض عليه',
    },
    {
      fullName: 'إبراهيم خليل الوزير',
      identityNumber: 'W1001-010',
      nationality: 'يمني',
      chargeDetails: 'تهريب آثار وقطع أثرية نادرة',
      issuingProvince: 'ذمار',
      dangerLevel: 'متوسط',
      status: 'مطلوب حياً',
    },
  ]

  let created = 0
  let updated = 0

  for (const person of wantedPersons) {
    const existing = await prisma.wantedPerson.findUnique({
      where: { identityNumber: person.identityNumber },
    })

    if (existing) {
      await prisma.wantedPerson.update({
        where: { identityNumber: person.identityNumber },
        data: person,
      })
      updated++
      console.log(`  🔄 ${person.fullName}`)
    } else {
      await prisma.wantedPerson.create({ data: person })
      created++
      console.log(`  ✅ ${person.fullName} (${person.dangerLevel})`)
    }
  }

  const total = await prisma.wantedPerson.count()

  // Create audit log entry for this seed
  const admin = await prisma.officer.findFirst({
    where: { role: 'SUPER_ADMIN' },
    orderBy: { createdAt: 'asc' },
  })

  if (admin) {
    await prisma.auditLog.create({
      data: {
        action: 'SEED_WANTED',
        entityType: 'WantedPerson',
        entityId: 'BATCH-001',
        officerId: admin.id,
        details: { created, updated, total },
      },
    })
  }

  console.log(`\n🚔 Wanted persons seed complete!`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   🔄 Updated: ${updated}`)
  console.log(`   📊 Total records: ${total}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })