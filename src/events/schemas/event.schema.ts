import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventStatus } from '../../common/enums';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, trim: true, minlength: 3, maxlength: 200 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, trim: true })
  location: string;

  @Prop({ required: true, min: 1 })
  maxParticipants: number;

  @Prop({ required: true, min: 0 })
  availableSeats: number;

  @Prop({
    type: String,
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ title: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ createdBy: 1 });
