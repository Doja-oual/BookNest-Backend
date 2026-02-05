import {
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    description: 'ID de l\'événement à réserver',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'L\'ID de l\'événement est requis' })
  @IsMongoId({ message: 'L\'ID de l\'événement doit être un ID MongoDB valide' })
  eventId: string;

  @ApiProperty({
    description: 'Nombre de places à réserver',
    example: 2,
    minimum: 1,
    maximum: 10,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le nombre de places doit être un nombre' })
  @Min(1, { message: 'Le nombre de places doit être au moins 1' })
  @Max(10, { message: 'Le nombre de places ne peut pas dépasser 10 par réservation' })
  numberOfSeats?: number = 1;
}
