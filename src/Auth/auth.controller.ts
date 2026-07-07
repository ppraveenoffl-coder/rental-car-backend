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
import { Auth, AllowExpired } from './guards/auth.decorator';
import { TenantId } from './guards/tenant.decorator';
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

  // POST /api/auth/forgot-password (public) — email a reset link
  @Post('forgot-password')
  async forgotPassword(@Body() body: any): Promise<any> {
    return this.authService.forgotPassword(body?.email);
  }

  // POST /api/auth/reset-password (public) — consume token + set new password
  @Post('reset-password')
  async resetPassword(@Body() body: any): Promise<any> {
    return this.authService.resetPasswordWithToken(body?.email, body?.token, body?.newPassword);
  }

  // GET /api/auth/me — reachable even when the subscription has lapsed so the
  // client can read the status and show the renew screen.
  @Get('me')
  @Auth()
  @AllowExpired()
  async me(@Req() req: any): Promise<any> {
    return { user: req.user };
  }

  // POST /api/auth/change-password — any signed-in user changes their own password
  @Post('change-password')
  @Auth()
  @AllowExpired()
  async changePassword(@Body() body: any, @Req() req: any): Promise<any> {
    return this.authService.changePassword(req.user.id, body?.currentPassword, body?.newPassword);
  }

  // GET /api/auth/users (admin)
  @Get('users')
  @Auth(Role.ADMIN)
  async listUsers(@TenantId() tenantId: string): Promise<any> {
    return this.authService.listUsers(tenantId);
  }

  // POST /api/auth/users (admin)
  @Post('users')
  @Auth(Role.ADMIN)
  async createUser(@Body() body: createUserDTO, @TenantId() tenantId: string): Promise<any> {
    return this.authService.createUser(body, tenantId);
  }

  // PUT /api/auth/users/:id (admin)
  @Put('users/:id')
  @Auth(Role.ADMIN)
  async updateUser(@Param('id') id: string, @Body() body: updateUserDTO, @TenantId() tenantId: string): Promise<any> {
    return this.authService.updateUser(id, body, tenantId);
  }

  // DELETE /api/auth/users/:id (admin)
  @Delete('users/:id')
  @Auth(Role.ADMIN)
  async deleteUser(@Param('id') id: string, @Req() req: any): Promise<any> {
    return this.authService.deleteUser(id, req.user.id, req.user.tenantId);
  }
}
