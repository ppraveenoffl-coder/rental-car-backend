import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Mirrors the reference's JwtAuthGuard, but returns the legacy JSON error shape
// `{ message }` with 401 so the existing frontend behaves identically.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new HttpException(
        { message: 'Invalid or expired token' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
}
