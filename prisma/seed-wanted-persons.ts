import { prisma } from '../lib/prisma'

async function seedWantedPersons() {
  // Seed departments for wanted persons unit
  const dept = await prisma.department.findFirst({
    where: { name: 'Criminal Investigation' }
  })

  if (!dept) return

  // Seed wanted persons
  const wantedPersons = [
    {
      name: 'Ahmed Mohammed Hassan',
      nationality: 'Yemen',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'MALE',
      physicalDescription: 'Height: 185cm, Build: Medium, Distinguishing marks: Scar on left cheek',
      charges: 'Human trafficking, smuggling',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      photoUrl: '/images/wanted-persons/person1.jpg',
    },
    {
      name: 'Fatima Ali Abdullah',
      nationality: 'Yemen',
      dateOfBirth: new Date('1990-07-22'),
      gender: 'FEMALE',
      physicalDescription: 'Height: 165cm, Build: Slim, Dark hair',
      charges: 'Drug trafficking, money laundering',
      severity: 'HIGH',
      status: 'ACTIVE',
      photoUrl: '/images/wanted-persons/person2.jpg',
    },
    {
      name: 'Ibrahim Salim Omar',
      nationality: 'Somalia',
      dateOfBirth: new Date('1988-11-08'),
      gender: 'MALE',
      physicalDescription: 'Height: 175cm, Build: Athletic, Tattoos on arms',
      charges: 'Armed robbery, assault',
      severity: 'HIGH',
      status: 'CAPTURED',
      photoUrl: '/images/wanted-persons/person3.jpg',
    },
  ]

  for (const person of wantedPersons) {
    await prisma.wantedPerson.upsert({
      where: { name: person.name },
      update: person,
      create: person,
    })
  }

  console.log(`✓ Seeded ${wantedPersons.length} wanted persons`)
}

seedWantedPersons()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
