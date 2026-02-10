import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterUserDto, LoginUserDto, UpdateUserDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const user = await this.usersService.create(
      registerUserDto.email,
      registerUserDto.password,
      registerUserDto.firstName,
      registerUserDto.lastName,
      registerUserDto.role,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toJSON();

    // Générer le token JWT pour l'utilisateur nouvellement créé
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const user = await this.usersService.findByEmail(loginUserDto.email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersService.updateProfile(userId, updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toJSON();

    return {
      message: 'Profil mis à jour avec succès',
      user: userWithoutPassword,
    };
  }
}
