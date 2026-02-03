import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';

export class RegisterUserDto {
  @ApiProperty({
    example: 'doja.oualla@gmail.cm',
    description: "Email de l'utilisateur",
  })
  @IsEmail({}, { message: "L'email doit être valide" })
  @IsString({ message: "L'email doit être une chaîne de caractères" })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mot de passe (minimum 6 caractères)',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  @MaxLength(50, {
    message: 'Le mot de passe ne doit pas dépasser 50 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  })
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.PARTICIPANT,
    description: "Rôle de l'utilisateur",
    default: UserRole.PARTICIPANT,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Le rôle doit être ADMIN ou PARTICIPANT' })
  role?: UserRole;

  @ApiProperty({
    example: 'Doja',
    description: "Prénom de l'utilisateur",
  })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le prénom ne doit pas dépasser 50 caractères' })
  firstName: string;

  @ApiProperty({
    example: 'Oualla',
    description: "Nom de famille de l'utilisateur",
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères' })
  lastName: string;
}
