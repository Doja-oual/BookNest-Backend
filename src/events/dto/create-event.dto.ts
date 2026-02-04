import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsDateString,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../common/enums';

export class CreateEventDto {
  @ApiProperty({
    example: 'Conférence Tech 2026',
    description: 'Titre de l\'événement',
  })
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre est requis' })
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caractères' })
  @MaxLength(200, { message: 'Le titre ne doit pas dépasser 200 caractères' })
  title: string;

  @ApiProperty({
    example: 'Une conférence sur les nouvelles technologies',
    description: 'Description de l\'événement',
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La description est requise' })
  @MaxLength(2000, {
    message: 'La description ne doit pas dépasser 2000 caractères',
  })
  description: string;

  @ApiProperty({
    example: '2026-03-15T14:00:00Z',
    description: 'Date et heure de l\'événement',
  })
  @IsDateString(
    {},
    { message: 'La date doit être au format ISO 8601 valide' },
  )
  @IsNotEmpty({ message: 'La date est requise' })
  date: string;

  @ApiProperty({
    example: 'Centre de conférences, Paris',
    description: 'Lieu de l\'événement',
  })
  @IsString({ message: 'Le lieu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le lieu est requis' })
  location: string;

  @ApiProperty({
    example: 100,
    description: 'Nombre maximum de participants',
  })
  @IsNumber({}, { message: 'Le nombre de participants doit être un nombre' })
  @Min(1, { message: 'Le nombre de participants doit être au moins 1' })
  maxParticipants: number;

  @ApiProperty({
    enum: EventStatus,
    example: EventStatus.DRAFT,
    description: 'Statut de l\'événement',
    required: false,
    default: EventStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Le statut doit être DRAFT, PUBLISHED, CANCELLED ou COMPLETED',
  })
  status?: EventStatus;
}
