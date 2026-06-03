/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth } from './guards/auth.decorator';
import { Role } from '../utils/enum/roles.enum';
import { loginDTO } from '../DTO/login.dto';
import { createUserDTO, updateUserDTO } from '../DTO/user.dto';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  // POST /api/auth/login
  @Post('login')
  async login(@Body() payload: loginDTO): Promise<any> {
    return this.authService.signIn(payload);
  }

  // GET /api/auth/me
  @Get('me')
  @Auth()
  async me(@Req() req: any): Promise<any> {
    return { user: req.user };
  }

  // GET /api/auth/users (admin)
  @Get('users')
  @Auth(Role.ADMIN)
  async listUsers(): Promise<any> {
    return this.authService.listUsers();
  }

  // POST /api/auth/users (admin)
  @Post('users')
  @Auth(Role.ADMIN)
  async createUser(@Body() body: createUserDTO): Promise<any> {
    return this.authService.createUser(body);
  }

  // PUT /api/auth/users/:id (admin)
  @Put('users/:id')
  @Auth(Role.ADMIN)
  async updateUser(@Param('id') id: string, @Body() body: updateUserDTO): Promise<any> {
    return this.authService.updateUser(id, body);
  }

  // DELETE /api/auth/users/:id (admin)
  @Delete('users/:id')
  @Auth(Role.ADMIN)
  async deleteUser(@Param('id') id: string, @Req() req: any): Promise<any> {
    return this.authService.deleteUser(id, req.user.id);
  }
}
