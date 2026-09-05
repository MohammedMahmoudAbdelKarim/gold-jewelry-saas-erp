import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserRepository } from './user.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super-secret-key-12345',
      signOptions: { expiresIn: '1h' },
    }),
    AuditModule,
  ],
  providers: [AuthService, UserRepository],
  controllers: [AuthController],
  exports: [AuthService, UserRepository],
})
export class AuthModule {}
