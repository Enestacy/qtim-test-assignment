import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../../../common/types';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = req.get('Refresh');
          return token ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('service.jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.get('Refresh');

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const { sub: userId } = payload;
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const credentials = await this.authRepository.findOneBy({ userId });
    if (!credentials || !credentials.refreshToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return payload;
  }
}
