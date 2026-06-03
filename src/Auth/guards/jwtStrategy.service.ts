/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategyService extends PassportStrategy(Strategy) {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'change-this-secret-in-production-7f3a9c2e',
      passReqToCallback: true,
    });
  }

  // payload = { id, role } signed at login. Resolve the live user and expose
  // the same shape the legacy Express `req.user` had.
  async validate(_req: any, payload: any): Promise<any> {
    return await this.authService.validateUser(payload);
  }
}
