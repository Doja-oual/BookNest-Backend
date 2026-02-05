import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getModelToken } from '@nestjs/mongoose';
import { Event } from './schemas/event.schema';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventStatus } from '../common/enums';
import { Types } from 'mongoose';

describe('EventsService', () => {
  let service: EventsService;
  let mockEventModel: any;

  const mockUserId = new Types.ObjectId('507f1f77bcf86cd799439012');
  const mockEventId = new Types.ObjectId('507f1f77bcf86cd799439011');

  const mockEvent = {
    _id: mockEventId,
    title: 'Test Event',
    description: 'Test Description',
    date: new Date('2026-12-31'),
    location: 'Test Location',
    maxParticipants: 100,
    availableSeats: 100,
    status: EventStatus.DRAFT,
    createdBy: mockUserId,
    save: jest.fn(),
  };

  beforeEach(async () => {
    const execMock = jest.fn();
    const populateMock = jest.fn(() => ({ exec: execMock }));
    const sortMock = jest.fn(() => ({ exec: execMock }));

    mockEventModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: mockEventId }),
    }));

    mockEventModel.find = jest.fn(() => ({
      populate: populateMock,
      sort: sortMock,
      exec: execMock,
    }));

    mockEventModel.findById = jest.fn(() => ({
      populate: populateMock,
      exec: execMock,
    }));

    mockEventModel.findByIdAndUpdate = jest.fn(() => ({
      exec: execMock,
    }));

    mockEventModel.findByIdAndDelete = jest.fn(() => ({
      exec: execMock,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new event successfully', async () => {
      const createEventDto = {
        title: 'New Event',
        description: 'Description',
        date: new Date('2026-12-31'),
        location: 'Location',
        maxParticipants: 50,
      };

      const result = await service.create(createEventDto, mockUserId.toString());

      expect(result).toBeDefined();
      expect(mockEventModel).toHaveBeenCalled();
    });

    it('should throw BadRequestException if date is in the past', async () => {
      const createEventDto = {
        title: 'Past Event',
        description: 'Description',
        date: new Date('2020-01-01'),
        location: 'Location',
        maxParticipants: 50,
      };

      await expect(
        service.create(createEventDto, mockUserId.toString()),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      const mockEvents = [mockEvent];
      const execMock = jest.fn().mockResolvedValue(mockEvents);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

      mockEventModel.find.mockReturnValue({
        populate: populateMock,
        sort: sortMock,
        exec: execMock,
      });

      const result = await service.findAll({});

      expect(result).toEqual(mockEvents);
      expect(mockEventModel.find).toHaveBeenCalled();
    });

    it('should filter events by status', async () => {
      const mockEvents = [mockEvent];
      const execMock = jest.fn().mockResolvedValue(mockEvents);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

      mockEventModel.find.mockReturnValue({
        populate: populateMock,
        sort: sortMock,
        exec: execMock,
      });

      await service.findAll({ status: EventStatus.PUBLISHED });

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: EventStatus.PUBLISHED }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      const execMock = jest.fn().mockResolvedValue(mockEvent);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });

      mockEventModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      const result = await service.findOne(mockEventId.toString());

      expect(result).toEqual(mockEvent);
      expect(mockEventModel.findById).toHaveBeenCalledWith(mockEventId.toString());
    });

    it('should throw NotFoundException if event not found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });

      mockEventModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      await expect(service.findOne(mockEventId.toString())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an event successfully', async () => {
      const updateEventDto = {
        title: 'Updated Title',
      };

      const updatedEvent = { ...mockEvent, ...updateEventDto };
      const execMock = jest.fn().mockResolvedValue(updatedEvent);
      const findByIdExecMock = jest.fn().mockResolvedValue(mockEvent);
      const populateMock = jest.fn().mockReturnValue({ exec: findByIdExecMock });
      const updatePopulateMock = jest.fn().mockReturnValue({ exec: execMock });

      mockEventModel.findById.mockReturnValue({
        populate: populateMock,
        exec: findByIdExecMock,
      });

      mockEventModel.findByIdAndUpdate.mockReturnValue({
        populate: updatePopulateMock,
        exec: execMock,
      });

      const result = await service.update(
        mockEventId.toString(),
        updateEventDto,
        mockUserId.toString(),
      );

      expect(result).toEqual(updatedEvent);
    });

    it('should throw ForbiddenException if user is not organizer', async () => {
      const updateEventDto = {
        title: 'Updated Title',
      };

      const execMock = jest.fn().mockResolvedValue(mockEvent);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });

      mockEventModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      await expect(
        service.update(mockEventId.toString(), updateEventDto, 'differentUserId'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete an event successfully', async () => {
      const execMock = jest.fn().mockResolvedValue(mockEvent);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      const deleteExecMock = jest.fn().mockResolvedValue(mockEvent);

      mockEventModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      mockEventModel.findByIdAndDelete.mockReturnValue({
        exec: deleteExecMock,
      });

      await service.delete(mockEventId.toString(), mockUserId.toString());

      expect(mockEventModel.findByIdAndDelete).toHaveBeenCalledWith(mockEventId.toString());
    });

    it('should throw ForbiddenException if user is not organizer', async () => {
      const execMock = jest.fn().mockResolvedValue(mockEvent);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });

      mockEventModel.findById.mockReturnValue({
        populate: populateMock,
        exec: execMock,
      });

      await expect(
        service.delete(mockEventId.toString(), 'differentUserId'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should update event status to PUBLISHED', async () => {
      const updatedEvent = { ...mockEvent, status: EventStatus.PUBLISHED };
      const execMock = jest.fn().mockResolvedValue(updatedEvent);
      const findByIdExecMock = jest.fn().mockResolvedValue(mockEvent);
      const populateMock = jest.fn().mockReturnValue({ exec: findByIdExecMock });
      const updatePopulateMock = jest.fn().mockReturnValue({ exec: execMock });

      mockEventModel.findById.mockReturnValue({
        populate: populateMock,
        exec: findByIdExecMock,
      });

      mockEventModel.findByIdAndUpdate.mockReturnValue({
        populate: updatePopulateMock,
        exec: execMock,
      });

      const result = await service.updateStatus(
        mockEventId.toString(),
        EventStatus.PUBLISHED,
        mockUserId.toString(),
      );

      expect(result.status).toBe(EventStatus.PUBLISHED);
    });
  });
});
