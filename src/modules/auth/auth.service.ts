import { UserService } from './../user/user.service';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthEntity } from './auth.entity';
import { withTransaction } from 'src/common/helpers';
import { LoginDto, RegisterDto } from './dto';
import { AuthRepository } from './auth.repository';
import { ConfigService } from '@nestjs/config';
import { TokensData } from './types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity)
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly datasource: DataSource,
    private readonly logger: Logger,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  async login({ login, password }: LoginDto) {
    try {
      const credentials = await this.authRepository.findOneBy({ login });
      if (!credentials) throw new NotFoundException('Credentials not found');

      const isPasswordMatches = await bcrypt.compare(password, credentials.password);

      if (!isPasswordMatches) throw new UnauthorizedException('Invalid password');

      const tokens = await this.generateTokens(credentials.userId, credentials.login);

      await this.updateRefreshToken(credentials.userId, tokens.refreshToken);

      return tokens;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async logout(userId: string): Promise<number> {
    try {
      const credentials = await this.authRepository.update(
        { userId },
        {
          refreshToken: null,
        },
      );
      if (!credentials) throw new InternalServerErrorException('Failed to logout');

      return credentials.affected;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async register(registrationData: RegisterDto) {
    return withTransaction(this.datasource, async queryRunner => {
      const { login, password, ...userData } = registrationData;
      const existingUser = await this.authRepository.findOneBy({ login });

      if (existingUser) {
        throw new ConflictException('User with this login already exists');
      }

      const user = await this.userService.create(userData, { queryRunner });

      if (!user) {
        throw new InternalServerErrorException('Failed to create user');
      }

      const tokens = await this.generateTokens(user.id, login);
      const refreshTokenHash = await this.hashData(tokens.refreshToken);
      const passwordHash = await this.hashData(password);

      const credentials = await this.authRepository.create({
        userId: user.id,
        login,
        password: passwordHash,
        refreshToken: refreshTokenHash,
      });

      await queryRunner.manager.save(AuthEntity, credentials);

      return tokens;
    });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const credentials = await this.authRepository.findOneBy({ userId });
    if (!credentials || !credentials.refreshToken) throw new UnauthorizedException();

    const refreshTokenMatches = await bcrypt.compare(refreshToken, credentials.refreshToken);

    if (!refreshTokenMatches) throw new UnauthorizedException();

    const tokens = await this.generateTokens(credentials.userId, credentials.login);
    await this.updateRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  // helpers

  private async generateTokens(sub: string, login: string): Promise<TokensData> {
    const payload = { login, sub };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('service.jwt.secret'),
        expiresIn: this.configService.get<string>('service.jwt.accessExpires'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('service.jwt.secret'),
        expiresIn: this.configService.get<string>('service.jwt.refreshExpires'),
      }),
    ]);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await this.hashData(refreshToken);
    const result = await this.authRepository.update(
      { userId },
      {
        refreshToken: hashedRefreshToken,
      },
    );
    if (!result) {
      throw new InternalServerErrorException('Failed to update refresh token');
    }
  }

  private async hashData(data: string) {
    return bcrypt.hash(data, this.configService.get<number>('service.bcrypt.salt'));
  }
}
