/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from '../schemas/user.schema';
import { loginDTO } from '../DTO/login.dto';
import { createUserDTO, updateUserDTO } from '../DTO/user.dto';
import { Role } from '../utils/enum/roles.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  private signToken(user: any): string {
    return this.jwtService.sign(
      { id: user.id, role: user.role },
      {
        secret: process.env.JWT_SECRET || 'change-this-secret-in-production-7f3a9c2e',
        expiresIn: process.env.JWT_EXPIRES || '7d',
      },
    );
  }

  // POST /api/auth/login → { token, user }
  async signIn(payload: loginDTO): Promise<any> {
    const user = await this.userModel.findOne({
      email: (payload.email || '').toLowerCase().trim(),
    });
    if (!user || !user.active) {
      throw new UnauthorizedException({ message: 'Invalid credentials' });
    }
    // trim password to tolerate trailing spaces / autofill whitespace
    const ok = await bcrypt.compare((payload.password || '').trim(), user.password);
    if (!ok) {
      throw new UnauthorizedException({ message: 'Invalid credentials' });
    }
    return { token: this.signToken(user), user: user.toJSON() };
  }

  // Used by the JWT strategy: resolve the live user from the token payload and
  // return the same shape the legacy Express `req.user` exposed.
  async validateUser(payload: any): Promise<any> {
    const user = await this.userModel.findById(payload.id);
    if (!user || !user.active) {
      throw new UnauthorizedException({ message: 'Invalid or inactive user' });
    }
    return { id: user.id, role: user.role, name: user.name, email: user.email };
  }

  // GET /api/auth/users (admin)
  async listUsers(): Promise<any> {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  // POST /api/auth/users (admin)
  async createUser(body: createUserDTO): Promise<any> {
    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      throw new BadRequestException({ message: 'name, email, password required' });
    }
    const exists = await this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      throw new ConflictException({ message: 'Email already in use' });
    }
    const hash = await bcrypt.hash(password, 10);
    return this.userModel.create({
      name,
      email,
      password: hash,
      role: role === Role.ADMIN ? Role.ADMIN : Role.STAFF,
    });
  }

  // PUT /api/auth/users/:id (admin)
  async updateUser(id: string, body: updateUserDTO): Promise<any> {
    const update: any = {};
    if (body.name) update.name = body.name;
    if (body.role) update.role = body.role === Role.ADMIN ? Role.ADMIN : Role.STAFF;
    if (typeof body.active === 'boolean') update.active = body.active;
    if (body.password) update.password = await bcrypt.hash(body.password, 10);

    const user = await this.userModel.findByIdAndUpdate(id, update, { new: true });
    if (!user) throw new BadRequestException({ message: 'Not found' });
    return user;
  }

  // DELETE /api/auth/users/:id (admin)
  async deleteUser(id: string, currentUserId: string): Promise<any> {
    if (id === currentUserId) {
      throw new BadRequestException({ message: 'Cannot delete yourself' });
    }
    await this.userModel.findByIdAndDelete(id);
    return { id, deleted: true };
  }
}
