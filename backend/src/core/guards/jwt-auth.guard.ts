import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    console.log(`[JwtAuthGuard] Path: ${request.method} ${request.url} | Has Token: ${!!token}`);
    if (!token) {
      console.warn('[JwtAuthGuard] Missing token');
      throw new UnauthorizedException('Missing token');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super-secret-key-12345',
      });
      console.log(`[JwtAuthGuard] Token verified successfully for: ${payload.email}`);
      // Attach details to Request
      request['user'] = payload;
    } catch (err: any) {
      console.error(`[JwtAuthGuard] Verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
