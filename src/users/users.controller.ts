import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (Admin or authenticated users)' })
  async findAll() {
    const users = await this.usersService.findAll();
    
    // Remove password from response
    return users.map((user) => {
      const userObj = user.toJSON();
      const { password, ...userWithoutPassword } = userObj;
      return userWithoutPassword;
    });
  }
}
