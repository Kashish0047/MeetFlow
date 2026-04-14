const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
 
  const user = await prisma.user.upsert({
    where: { email: 'hello@meetflow.com' },
    update: {},
    create: {
      username: 'meetflow',
      name: 'MeetFlow Admin',
      email: 'hello@meetflow.com',
    },
  });

  console.log('User created:', user.username);

 
  const schedule = await prisma.schedule.upsert({
    where: { id: 1 },
    update: {
        timezone: 'Asia/Kolkata'
    },
    create: {
      id: 1,
      name: 'Standard Working Hours',
      isDefault: true,
      timezone: 'Asia/Kolkata',
      userId: user.id,
      availability: {
        create: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
        ]
      }
    }
  });

  console.log('Default schedule created with timezone Asia/Kolkata');

  
  const eventTypes = [
    {
      title: '15 Min Discovery Call',
      slug: 'intro',
      duration: 15,
      bufferTime: 5,
      userId: user.id,
      scheduleId: schedule.id,
    },
    {
      title: '30 Min Strategy Session',
      slug: 'strategy',
      duration: 30,
      bufferTime: 10,
      userId: user.id,
      scheduleId: schedule.id,
    },
    {
        title: '60 Min Consulting',
        slug: 'consulting',
        duration: 60,
        bufferTime: 15,
        userId: user.id,
        scheduleId: schedule.id,
    }
  ];

  for (const et of eventTypes) {
    await prisma.eventType.upsert({
      where: { slug: et.slug },
      update: et,
      create: et,
    });
  }

  console.log('Event types seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
