import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto, UpdateEventDto } from './dto';
import { EventStatus } from '../common/enums';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    userId: string,
  ): Promise<EventDocument> {
    const eventDate = new Date(createEventDto.date);
    if (eventDate < new Date()) {
      throw new BadRequestException(
        'La date de l\'événement ne peut pas être dans le passé',
      );
    }

    const event = new this.eventModel({
      ...createEventDto,
      createdBy: new Types.ObjectId(userId),
      availableSeats: createEventDto.maxParticipants,
    });

    return event.save();
  }

  async findAll(filters?: {
    status?: EventStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<EventDocument[]> {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    return this.eventModel
      .find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ date: 1 })
      .exec();
  }

  async findOne(id: string): Promise<EventDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID d\'événement invalide');
    }

    const event = await this.eventModel
      .findById(id)
      .populate('createdBy', 'firstName lastName email')
      .exec();

    if (!event) {
      throw new NotFoundException('Événement non trouvé');
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    userId: string,
  ): Promise<EventDocument> {
    const event = await this.findOne(id);

    if (event.createdBy._id.toString() !== userId) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à modifier cet événement',
      );
    }

    if (updateEventDto.date) {
      const eventDate = new Date(updateEventDto.date);
      if (eventDate < new Date()) {
        throw new BadRequestException(
          'La date de l\'événement ne peut pas être dans le passé',
        );
      }
    }

    if (updateEventDto.maxParticipants !== undefined) {
      const reservedSeats = event.maxParticipants - event.availableSeats;
      if (updateEventDto.maxParticipants < reservedSeats) {
        throw new BadRequestException(
          `Impossible de réduire la capacité en dessous de ${reservedSeats} (nombre de réservations existantes)`,
        );
      }
      updateEventDto['availableSeats'] =
        updateEventDto.maxParticipants - reservedSeats;
    }

    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, { $set: updateEventDto }, { new: true })
      .populate('createdBy', 'firstName lastName email')
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
    }

    return updatedEvent;
  }

  async delete(id: string, userId: string): Promise<void> {
    const event = await this.findOne(id);

    if (event.createdBy._id.toString() !== userId) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à supprimer cet événement',
      );
    }

    await this.eventModel.findByIdAndDelete(id).exec();
  }

  async updateStatus(
    id: string,
    status: EventStatus,
    userId: string,
  ): Promise<EventDocument> {
    const event = await this.findOne(id);

    if (event.createdBy._id.toString() !== userId) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à modifier cet événement',
      );
    }

    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .populate('createdBy', 'firstName lastName email')
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
    }

    return updatedEvent;
  }
}
