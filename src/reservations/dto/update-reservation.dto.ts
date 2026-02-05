import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReservationStatus } from '../../common/enums';

export class UpdateReservationDto {
  @ApiProperty({
    description: 'Statut de la réservation',
    enum: ReservationStatus,
    example: ReservationStatus.CANCELLED,
  })
  @IsEnum(ReservationStatus, {
    message: 'Le statut doit être une valeur valide (PENDING, CONFIRMED, CANCELLED)',
  })
  status: ReservationStatus;
}
