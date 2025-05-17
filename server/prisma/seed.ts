import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with test data...');
  
  // Create test users
  const users = [
    {
      id: 'user123',
      name: 'Test User',
    },
    {
      id: 'user456',
      name: 'Another User',
    },
    {
      id: 'owner-id',
      name: 'Session Owner',
    },
    {
      id: 'owner-user-id',
      name: 'Owner',
    },
    {
      id: 'participant-user-id',
      name: 'Participant',
    },
    {
      id: 'different-user',
      name: 'Different User',
    },
  ];

  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user,
      });
      console.log(`Created user: ${user.name} (${user.id})`);
    } catch (error) {
      console.error(`Error creating user ${user.id}:`, error);
    }
  }

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 