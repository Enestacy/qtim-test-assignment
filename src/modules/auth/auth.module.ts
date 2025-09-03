import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthEntity } from './auth.entity';
import { AccessTokenStrategy } from './strategies/jwt-access.strategy';
import { RefreshTokenStrategy } from './strategies/jwt-refresh.strategy';
import { UserModule } from '../user';
import { JwtModule } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('service.jwt.secret'),
      }),
      inject: [ConfigService],
    }),
    PassportModule,
    ConfigModule,
    UserModule,
  ],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy, AuthRepository],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
