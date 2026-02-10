import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.seed' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/users/users.service';
import { EventsService } from './src/events/events.service';
import { ReservationsService } from './src/reservations/reservations.service';
import { EventStatus } from './src/common/enums';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const eventsService = app.get(EventsService);
  const reservationsService = app.get(ReservationsService);

  try {
    // ========== 1. CREATE USERS ==========
    console.log('👤 Creating users...');
    
    // Admin
    const admin = await usersService.create(
      'admin@booknest.com',
      'Admin123!',
      'Ahmed',
      'Administrateur',
      'ADMIN',
    );
    console.log('✅ Admin created:', admin.email);

    // Participants
    const participant1 = await usersService.create(
      'mohamed@example.com',
      'User123!',
      'Mohamed',
      'Alami',
      'PARTICIPANT',
    );
    console.log('✅ Participant 1 created:', participant1.email);

    const participant2 = await usersService.create(
      'fatima@example.com',
      'User123!',
      'Fatima',
      'Zahra',
      'PARTICIPANT',
    );
    console.log('✅ Participant 2 created:', participant2.email);

    const participant3 = await usersService.create(
      'youssef@example.com',
      'User123!',
      'Youssef',
      'Bennani',
      'PARTICIPANT',
    );
    console.log('✅ Participant 3 created:', participant3.email);

    console.log('\n📅 Creating events...');

    // ========== 2. CREATE EVENTS ==========
    
    // Event 1 - Formation TypeScript (Published)
    const event1 = await eventsService.create(
      {
        title: 'Formation TypeScript Avancé',
        description: 'Formation complète sur TypeScript avec exemples pratiques et projets réels',
        date: '2026-03-15T10:00:00',
        location: 'Casablanca Tech Hub',
        maxParticipants: 30,
      },
      admin._id.toString(),
    );
    await eventsService.update(
      event1._id.toString(),
      { status: EventStatus.PUBLISHED },
      admin._id.toString(),
    );
    console.log('✅ Event 1 created:', event1.title, '(PUBLISHED)');

    // Event 2 - Atelier NestJS (Published)
    const event2 = await eventsService.create(
      {
        title: 'Atelier NestJS & MongoDB',
        description: 'Apprendre à créer des APIs robustes avec NestJS et MongoDB',
        date: '2026-03-20T14:00:00',
        location: 'Rabat Innovation Center',
        maxParticipants: 25,
      },
      admin._id.toString(),
    );
    await eventsService.update(
      event2._id.toString(),
      { status: EventStatus.PUBLISHED },
      admin._id.toString(),
    );
    console.log('✅ Event 2 created:', event2.title, '(PUBLISHED)');

    // Event 3 - Conférence DevOps (Published)
    const event3 = await eventsService.create(
      {
        title: 'Conférence DevOps & CI/CD',
        description: 'Les meilleures pratiques DevOps avec Docker, Kubernetes et GitHub Actions',
        date: '2026-04-05T09:00:00',
        location: 'Marrakech Tech Conference',
        maxParticipants: 100,
      },
      admin._id.toString(),
    );
    await eventsService.update(
      event3._id.toString(),
      { status: EventStatus.PUBLISHED },
      admin._id.toString(),
    );
    console.log('✅ Event 3 created:', event3.title, '(PUBLISHED)');

    // Event 4 - Workshop React (Published)
    const event4 = await eventsService.create(
      {
        title: 'Workshop React & Next.js',
        description: 'Créer des applications web modernes avec React et Next.js',
        date: '2026-03-25T15:00:00',
        location: 'Tanger Digital Hub',
        maxParticipants: 40,
      },
      admin._id.toString(),
    );
    await eventsService.update(
      event4._id.toString(),
      { status: EventStatus.PUBLISHED },
      admin._id.toString(),
    );
    console.log('✅ Event 4 created:', event4.title, '(PUBLISHED)');

    // Event 5 - Draft Event (Not Published)
    const event5 = await eventsService.create(
      {
        title: 'Formation Docker & Kubernetes',
        description: 'Maîtriser la containerisation et l\'orchestration',
        date: '2026-05-10T10:00:00',
        location: 'Fès Tech Park',
        maxParticipants: 35,
      },
      admin._id.toString(),
    );
    console.log('✅ Event 5 created:', event5.title, '(DRAFT - not published)');

    console.log('\n🎫 Creating reservations...');

    // ========== 3. CREATE RESERVATIONS ==========
    
    // Reservation 1 - Mohamed pour TypeScript (PENDING)
    const reservation1 = await reservationsService.create(
      {
        eventId: event1._id.toString(),
        numberOfSeats: 2,
      },
      participant1._id.toString(),
    );
    console.log('✅ Reservation 1 created: Mohamed → TypeScript (PENDING)');

    // Reservation 2 - Fatima pour NestJS (PENDING)
    const reservation2 = await reservationsService.create(
      {
        eventId: event2._id.toString(),
        numberOfSeats: 1,
      },
      participant2._id.toString(),
    );
    console.log('✅ Reservation 2 created: Fatima → NestJS (PENDING)');

    // Reservation 3 - Youssef pour DevOps (PENDING)
    const reservation3 = await reservationsService.create(
      {
        eventId: event3._id.toString(),
        numberOfSeats: 3,
      },
      participant3._id.toString(),
    );
    console.log('✅ Reservation 3 created: Youssef → DevOps (PENDING)');

    // Reservation 4 - Mohamed pour React (PENDING)
    const reservation4 = await reservationsService.create(
      {
        eventId: event4._id.toString(),
        numberOfSeats: 1,
      },
      participant1._id.toString(),
    );
    console.log('✅ Reservation 4 created: Mohamed → React (PENDING)');

    // Reservation 5 - Fatima pour TypeScript (PENDING)
    const reservation5 = await reservationsService.create(
      {
        eventId: event1._id.toString(),
        numberOfSeats: 5,
      },
      participant2._id.toString(),
    );
    console.log('✅ Reservation 5 created: Fatima → TypeScript (PENDING)');

    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - Users: 4 (1 Admin + 3 Participants)');
    console.log('  - Events: 5 (4 Published + 1 Draft)');
    console.log('  - Reservations: 5 (All Pending - Admin can confirm/refuse them)');
    console.log('\n🔐 Login credentials:');
    console.log('  Admin: admin@booknest.com / Admin123!');
    console.log('  User 1: mohamed@example.com / User123!');
    console.log('  User 2: fatima@example.com / User123!');
    console.log('  User 3: youssef@example.com / User123!');
    console.log('\n🚀 API running on: http://localhost:3000');
    console.log('📚 Swagger docs: http://localhost:3000/api/docs\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.code === 11000) {
      console.error('💡 Tip: Users already exist. Clear database first with: npm run seed:clear');
    }
  } finally {
    await app.close();
  }
}

seedDatabase();
