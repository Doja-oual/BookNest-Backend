import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { getModelToken } from '@nestjs/mongoose';
import { Reservation } from './schemas/reservation.schema';
import { EventsService } from '../events/events.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ReservationStatus, EventStatus } from '../common/enums';
import { Types } from 'mongoose';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let mockReservationModel: any;
  let mockEventsService: any;

  const mockUserId = new Types.ObjectId('507f1f77bcf86cd799439012');
  const mockEventId = new Types.ObjectId('507f1f77bcf86cd799439013');
  const mockReservationId = new Types.ObjectId('507f1f77bcf86cd799439011');

  const mockReservation = {
    _id: mockReservationId,
    user: mockUserId,
    event: mockEventId,
    status: ReservationStatus.PENDING,
    numberOfSeats: 1,
    save: jest.fn(),
  };

  const mockEvent = {
    _id: mockEventId,
    title: 'Test Event',
    status: EventStatus.PUBLISHED,
    availableSeats: 50,
    date: new Date('2026-12-31'),
  };

  beforeEach(async () => {
    const execMock = jest.fn();
    const populateMock = jest.fn(() => ({ populate: populateMock, exec: execMock, sort: jest.fn().mockReturnValue({ exec: execMock }) }));
    const sortMock = jest.fn(() => ({ exec: execMock }));

    mockReservationModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: mockReservationId }),
    }));

    mockReservationModel.findOne = jest.fn(() => ({
      exec: execMock,
    }));

    mockReservationModel.find = jest.fn(() => ({
      populate: populateMock,
      sort: sortMock,
      exec: execMock,
    }));

    mockReservationModel.findById = jest.fn(() => ({
      populate: populateMock,
      exec: execMock,
    }));

    mockEventsService = {
      findOne: jest.fn(),
      decrementAvailableSeats: jest.fn(),
      incrementAvailableSeats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a reservation successfully', async () => {
      const createReservationDto = {
        eventId: mockEventId.toString(),
        numberOfSeats: 1,
      };

      const savedReservation = {
        ...mockReservation,
        populate: jest.fn().mockReturnThis(),
      };

      const execMock = jest.fn().mockResolvedValue(null);
      mockEventsService.findOne.mockResolvedValue(mockEvent);
      mockEventsService['eventModel'] = {
        findByIdAndUpdate: jest.fn(() => ({
          exec: jest.fn().mockResolvedValue(mockEvent),
        })),
      };
      
      mockReservationModel.findOne.mockReturnValue({
        exec: execMock,
      });

      mockReservationModel.mockImplementation(() => ({
        ...mockReservation,
        save: jest.fn().mockResolvedValue(savedReservation),
      }));

      await service.create(createReservationDto, mockUserId.toString());

      expect(mockEventsService.findOne).toHaveBeenCalledWith(mockEventId.toString());
    });

    it('should throw BadRequestException if event is not published', async () => {
      const createReservationDto = {
        eventId: mockEventId.toString(),
        numberOfSeats: 1,
      };

      const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
      mockEventsService.findOne.mockResolvedValue(draftEvent);

      await expect(
        service.create(createReservationDto, mockUserId.toString()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if reservation already exists', async () => {
      const createReservationDto = {
        eventId: mockEventId.toString(),
        numberOfSeats: 1,
      };

      const execMock = jest.fn().mockResolvedValue(mockReservation);
      mockEventsService.findOne.mockResolvedValue(mockEvent);
      mockReservationModel.findOne.mockReturnValue({
        exec: execMock,
      });

      await expect(
        service.create(createReservationDto, mockUserId.toString()),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if no seats available', async () => {
      const createReservationDto = {
        eventId: mockEventId.toString(),
        numberOfSeats: 1,
      };

      const fullEvent = { ...mockEvent, availableSeats: 0 };
      mockEventsService.findOne.mockResolvedValue(fullEvent);

      await expect(
        service.create(createReservationDto, mockUserId.toString()),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMyReservations', () => {
    it('should return user reservations', async () => {
      const mockReservations = [mockReservation];
      const execMock = jest.fn().mockResolvedValue(mockReservations);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock = jest.fn(() => ({
        populate: populateMock,
        sort: sortMock,
        exec: execMock,
      }));

      mockReservationModel.find.mockReturnValue({
        populate: populateMock,
        sort: sortMock,
        exec: execMock,
      });

      const result = await service.findMyReservations(mockUserId.toString());

      expect(result).toEqual(mockReservations);
      expect(mockReservationModel.find).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending reservation successfully', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        user: { _id: mockUserId },
        event: mockEventId,
        numberOfSeats: 1,
        save: jest.fn(),
      };

      const execMock = jest.fn().mockResolvedValue(reservation);
      const populateMock = jest.fn(() => ({ populate: populateMock, exec: execMock }));

      mockReservationModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      mockEventsService['eventModel'] = {
        findByIdAndUpdate: jest.fn(() => ({
          exec: jest.fn().mockResolvedValue(mockEvent),
        })),
      };

      reservation.save.mockResolvedValue({ ...reservation, status: ReservationStatus.CANCELLED });

      await service.cancel(mockReservationId.toString(), mockUserId.toString());

      expect(reservation.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own reservation', async () => {
      const reservation = {
        ...mockReservation,
        user: { _id: mockUserId },
      };

      const execMock = jest.fn().mockResolvedValue(reservation);
      const populateMock = jest.fn(() => ({ populate: populateMock, exec: execMock }));

      mockReservationModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      await expect(
        service.cancel(mockReservationId.toString(), 'differentUserId'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('confirmReservation', () => {
    it('should confirm a pending reservation', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        save: jest.fn(),
      };

      const execMock = jest.fn().mockResolvedValue(reservation);
      const populateMock = jest.fn(() => ({ populate: populateMock, exec: execMock }));

      mockReservationModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      reservation.save.mockResolvedValue({ ...reservation, status: ReservationStatus.CONFIRMED });

      const result = await service.confirmReservation(mockReservationId.toString());

      expect(result).toBeDefined();
      expect(reservation.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if reservation not pending', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };

      const execMock = jest.fn().mockResolvedValue(confirmedReservation);
      const populateMock = jest.fn(() => ({ populate: populateMock, exec: execMock }));

      mockReservationModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      await expect(
        service.confirmReservation(mockReservationId.toString()),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refuseReservation', () => {
    it('should refuse a pending reservation', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        event: mockEventId,
        numberOfSeats: 1,
        save: jest.fn(),
      };

      const execMock = jest.fn().mockResolvedValue(reservation);
      const populateMock = jest.fn(() => ({ populate: populateMock, exec: execMock }));

      mockReservationModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      reservation.save.mockResolvedValue({ ...reservation, status: ReservationStatus.REFUSED });

      const result = await service.refuseReservation(mockReservationId.toString());

      expect(result).toBeDefined();
    });

    it('should restore seats if refusing a confirmed reservation', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
        event: mockEventId,
        numberOfSeats: 1,
        save: jest.fn(),
      };

      const execMock = jest.fn().mockResolvedValue(confirmedReservation);
      const populateMock = jest.fn(() => ({ populate: populateMock, exec: execMock }));

      mockReservationModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      mockEventsService['eventModel'] = {
        findByIdAndUpdate: jest.fn(() => ({
          exec: jest.fn().mockResolvedValue(mockEvent),
        })),
      };

      confirmedReservation.save.mockResolvedValue({
        ...confirmedReservation,
        status: ReservationStatus.REFUSED,
      });

      await service.refuseReservation(mockReservationId.toString());

      expect(mockEventsService['eventModel'].findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('adminCancelReservation', () => {
    it('should cancel any reservation as admin', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        event: mockEventId,
        numberOfSeats: 1,
        save: jest.fn(),
      };

      const execMock = jest.fn().mockResolvedValue(reservation);
      const populateMock = jest.fn(() => ({ populate: populateMock, exec: execMock }));

      mockReservationModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      reservation.save.mockResolvedValue({ ...reservation, status: ReservationStatus.CANCELLED });

      const result = await service.adminCancelReservation(mockReservationId.toString());

      expect(result).toBeDefined();
    });

    it('should restore seats if cancelling confirmed reservation', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
        event: mockEventId,
        numberOfSeats: 1,
        save: jest.fn(),
      };

      const execMock = jest.fn().mockResolvedValue(confirmedReservation);
      const populateMock = jest.fn(() => ({ populate: populateMock, exec: execMock }));

      mockReservationModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      mockEventsService['eventModel'] = {
        findByIdAndUpdate: jest.fn(() => ({
          exec: jest.fn().mockResolvedValue(mockEvent),
        })),
      };

      confirmedReservation.save.mockResolvedValue({
        ...confirmedReservation,
        status: ReservationStatus.CANCELLED,
      });

      await service.adminCancelReservation(mockReservationId.toString());

      expect(mockEventsService['eventModel'].findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
