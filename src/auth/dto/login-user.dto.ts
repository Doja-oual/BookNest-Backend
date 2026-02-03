import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: 'doja.oualla@gmail.cm',
    description: "Email de l'utilisateur",
  })
  @IsEmail({}, { message: "L'email doit être valide" })
  @IsString({ message: "L'email doit être une chaîne de caractères" })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: "Mot de passe de l'utilisateur",
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password: string;
}
