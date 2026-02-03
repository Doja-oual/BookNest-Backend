import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(email: string, password: string, firstName: string, lastName: string, role?: string): Promise<User> {
  
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'PARTICIPANT',
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}