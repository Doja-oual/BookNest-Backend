import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { CreateReservationDto } from './dto';
import { ReservationStatus, EventStatus } from '../common/enums';
import { EventsService } from '../events/events.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    private eventsService: EventsService,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
    userId: string,
  ): Promise<ReservationDocument> {
    const { eventId, numberOfSeats = 1 } = createReservationDto;

    // Vérifier que l'événement existe
    const event = await this.eventsService.findOne(eventId);

    // Vérifier que l'événement est publié
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException(
        'Impossible de réserver un événement qui n\'est pas publié',
      );
    }

    // Vérifier que l'événement n'est pas dans le passé
    if (new Date(event.date) < new Date()) {
      throw new BadRequestException(
        'Impossible de réserver un événement passé',
      );
    }

    // Vérifier qu'il y a assez de places disponibles
    if (event.availableSeats < numberOfSeats) {
      throw new BadRequestException(
        `Seulement ${event.availableSeats} place(s) disponible(s)`,
      );
    }

    // Vérifier que l'utilisateur n'a pas déjà une réservation active pour cet événement
    const existingReservation = await this.reservationModel
      .findOne({
        event: eventId as any,
        user: userId as any,
        status: { $ne: ReservationStatus.CANCELLED },
      })
      .exec();

    if (existingReservation) {
      throw new ConflictException(
        'Vous avez déjà une réservation active pour cet événement',
      );
    }

    // Créer la réservation
    const reservation = new this.reservationModel({
      event: new Types.ObjectId(eventId),
      user: new Types.ObjectId(userId),
      numberOfSeats,
      status: ReservationStatus.CONFIRMED,
      reservationDate: new Date(),
    });

    const savedReservation = await reservation.save();

    // Mettre à jour le nombre de places disponibles
    await this.eventsService['eventModel']
      .findByIdAndUpdate(eventId, {
        $inc: { availableSeats: -numberOfSeats },
      })
      .exec();

    return savedReservation.populate([
      { path: 'event', select: 'title date location status' },
      { path: 'user', select: 'firstName lastName email' },
    ]);
  }

  async findMyReservations(userId: string): Promise<ReservationDocument[]> {
    return this.reservationModel
      .find({ user: userId as any })
      .populate('event', 'title date location status maxParticipants availableSeats')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ReservationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de réservation invalide');
    }

    const reservation = await this.reservationModel
      .findById(id)
      .populate('event', 'title date location status')
      .populate('user', 'firstName lastName email')
      .exec();

    if (!reservation) {
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }

    return reservation;
  }

  async cancel(id: string, userId: string): Promise<ReservationDocument> {
    const reservation = await this.findOne(id);

    // Vérifier que c'est bien l'utilisateur qui a fait la réservation
    if ((reservation.user as any)._id.toString() !== userId) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à annuler cette réservation',
      );
    }

    // Vérifier que la réservation n'est pas déjà annulée
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Cette réservation est déjà annulée');
    }

    // Mettre à jour le statut
    reservation.status = ReservationStatus.CANCELLED;
    await reservation.save();

    // Remettre les places disponibles
    await this.eventsService['eventModel']
      .findByIdAndUpdate((reservation.event as any)._id, {
        $inc: { availableSeats: reservation.numberOfSeats },
      })
      .exec();

    return reservation;
  }

  async findByEvent(eventId: string): Promise<ReservationDocument[]> {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('ID d\'événement invalide');
    }

    return this.reservationModel
      .find({
        event: eventId as any,
        status: { $ne: ReservationStatus.CANCELLED },
      })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getReservationStats(eventId: string) {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('ID d\'événement invalide');
    }

    const stats = await this.reservationModel.aggregate([
      {
        $match: {
          event: new Types.ObjectId(eventId),
          status: { $ne: ReservationStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: null,
          totalReservations: { $sum: 1 },
          totalSeatsReserved: { $sum: '$numberOfSeats' },
        },
      },
    ]);

    return stats[0] || { totalReservations: 0, totalSeatsReserved: 0 };
  }
}
