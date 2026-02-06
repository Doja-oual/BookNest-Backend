import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { EventStatus } from '../src/common/enums';

describe('Events & Reservations E2E Tests', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let adminToken: string;
  let participantToken: string;
  let adminId: string;
  let participantId: string;
  let eventId: string;
  let reservationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
    await app.init();

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin-${Date.now()}@example.com`,
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      });

    adminToken = adminResponse.body.access_token;
    adminId = adminResponse.body.user._id;

    const participantResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `participant-${Date.now()}@example.com`,
        password: 'Participant123!',
        firstName: 'Participant',
        lastName: 'User',
      });

    participantToken = participantResponse.body.access_token;
    participantId = participantResponse.body.user._id;
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await app.close();
  });

  describe('Events Flow', () => {
    it('Admin devrait créer un événement', async () => {
      const createEventDto = {
        title: 'Test Conference',
        description: 'A test conference event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        maxParticipants: 50,
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createEventDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title', createEventDto.title);
      expect(response.body).toHaveProperty('status', EventStatus.DRAFT);
      expect(response.body).toHaveProperty('availableSeats', 50);

      eventId = response.body._id;
    });

    it('Participant ne devrait PAS pouvoir créer un événement', async () => {
      const createEventDto = {
        title: 'Unauthorized Event',
        description: 'Should fail',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test',
        maxParticipants: 10,
      };

      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(createEventDto)
        .expect(403);
    });

    it('Admin devrait publier l\'événement', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/events/${eventId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: EventStatus.PUBLISHED })
        .expect(200);

      expect(response.body).toHaveProperty('status', EventStatus.PUBLISHED);
    });

    it('Participant devrait voir l\'événement publié', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const event = response.body.find((e: any) => e._id === eventId);
      expect(event).toBeDefined();
      expect(event.status).toBe(EventStatus.PUBLISHED);
    });
  });

  describe('Reservations Flow', () => {
    it('Participant devrait créer une réservation', async () => {
      const createReservationDto = {
        eventId,
        numberOfSeats: 2,
      };

      const response = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(createReservationDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('status', 'PENDING');
      expect(response.body).toHaveProperty('numberOfSeats', 2);

      reservationId = response.body._id;
    });

    it('Participant ne devrait PAS pouvoir réserver deux fois le même événement', async () => {
      const createReservationDto = {
        eventId,
        numberOfSeats: 1,
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(createReservationDto)
        .expect(409);
    });

    it('Admin devrait confirmer la réservation', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/reservations/${reservationId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'CONFIRMED');
    });

    it('Participant devrait voir sa réservation confirmée', async () => {
      const response = await request(app.getHttpServer())
        .get('/reservations/my-reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const reservation = response.body.find((r: any) => r._id === reservationId);
      expect(reservation).toBeDefined();
      expect(reservation.status).toBe('CONFIRMED');
    });

    it('Admin devrait annuler la réservation', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/reservations/${reservationId}/admin-cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'CANCELED');
    });

    it('Les places devraient être restaurées après annulation', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('availableSeats', 50);
    });
  });
});
