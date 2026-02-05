import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ReservationStatus } from '../../common/enums';
import { User } from '../../users/schemas/user.schema';
import { Event } from '../../events/schemas/event.schema';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  })
  event: Event;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: User;

  @Prop({
    type: String,
    enum: ReservationStatus,
    default: ReservationStatus.CONFIRMED,
    index: true,
  })
  status: ReservationStatus;

  @Prop({ type: Date, default: Date.now })
  reservationDate: Date;

  @Prop({ type: Number, required: true, min: 1, default: 1 })
  numberOfSeats: number;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// Index composé pour éviter les réservations en double pour un même utilisateur/événement actif
ReservationSchema.index(
  { user: 1, event: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $ne: ReservationStatus.CANCELLED },
    },
  },
);
