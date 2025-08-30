import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { UserService } from '../user/user.service';
import { AuthEntity } from './auth.entity';
import { LoginDto, RegisterDto } from './dto';
import { UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UserEntity } from '../user/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let userService: jest.Mocked<UserService>;
  let datasource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findOneBy: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
        Logger,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    userService = module.get(UserService);
    datasource = module.get(DataSource);

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedData');

    configService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'service.jwt.secret':
          return 'test-secret';
        case 'service.jwt.accessExpires':
          return '15m';
        case 'service.jwt.refreshExpires':
          return '7d';
        case 'service.bcrypt.salt':
          return 10;
        default:
          return undefined;
      }
    });
    jwtService.signAsync.mockResolvedValue('token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser: UserEntity = {
      id: randomUUID(),
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const mockAuthEntity: AuthEntity = {
      id: randomUUID(),
      userId: mockUser.id,
      login: 'testuser',
      password: 'hashedPassword',
      refreshToken: 'hashedRefreshToken',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: mockUser,
    };

    const loginDto: LoginDto = {
      login: 'testuser',
      password: 'password123',
    };

    it('should successfully login with correct credentials', async () => {
      const repositoryFindOneBySpy = jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(mockAuthEntity);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('access-token');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('refresh-token');
      jest.spyOn(authRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.login(loginDto);

      expect(repositoryFindOneBySpy).toHaveBeenCalledWith({ login: 'testuser' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException if credentials are not found', async () => {
      const repositoryFindOneBySpy = jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(repositoryFindOneBySpy).toHaveBeenCalledWith({ login: 'testuser' });
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(mockAuthEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });
  });

  describe('logout', () => {
    const mockUser: UserEntity = {
      id: randomUUID(),
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    it('should successfully logout', async () => {
      const repositoryUpdateSpy = jest.spyOn(authRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.logout(mockUser.id);

      expect(repositoryUpdateSpy).toHaveBeenCalledWith({ userId: mockUser.id }, { refreshToken: null });
      expect(result).toBeUndefined();
    });

    it('should throw InternalServerErrorException if update fails', async () => {
      const repositoryUpdateSpy = jest.spyOn(authRepository, 'update').mockResolvedValue({ affected: 0 } as any);

      await expect(service.logout(mockUser.id)).rejects.toThrow(InternalServerErrorException);
      expect(repositoryUpdateSpy).toHaveBeenCalledWith({ userId: mockUser.id }, { refreshToken: null });
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      login: 'newuser',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Smith',
    };
    const mockUser: UserEntity = {
      id: randomUUID(),
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const mockAuthEntity: AuthEntity = {
      id: randomUUID(),
      userId: mockUser.id,
      login: 'newuser',
      password: 'hashedPassword',
      refreshToken: 'hashedRefreshToken',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: mockUser,
    };

    it('should successfully register a new user', async () => {
      const mockQueryRunner = {
        manager: {
          save: jest.fn().mockResolvedValue(mockAuthEntity),
        },
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(datasource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      const authRepositoryFindOneBySpy = jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(null);
      const userServiceCreateSpy = jest.spyOn(userService, 'create').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('access-token');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('refresh-token');
      jest.spyOn(authRepository, 'create').mockResolvedValue(mockAuthEntity);

      const result = await service.register(registerDto);

      expect(authRepositoryFindOneBySpy).toHaveBeenCalledWith({ login: 'newuser' });
      expect(userServiceCreateSpy).toHaveBeenCalledWith(
        { firstName: 'Jane', lastName: 'Smith' },
        { queryRunner: mockQueryRunner },
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const mockQueryRunner = {
        manager: {
          save: jest.fn(),
        },
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(datasource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      const authRepositoryFindOneBySpy = jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(mockAuthEntity);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(authRepositoryFindOneBySpy).toHaveBeenCalledWith({ login: 'newuser' });
    });

    it('should throw InternalServerErrorException if user creation fails', async () => {
      const mockQueryRunner = {
        manager: {
          save: jest.fn(),
        },
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(datasource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);
      const authRepositoryFindOneBySpy = jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(null);
      const userServiceCreateSpy = jest.spyOn(userService, 'create').mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(InternalServerErrorException);
      expect(authRepositoryFindOneBySpy).toHaveBeenCalledWith({ login: 'newuser' });
      expect(userServiceCreateSpy).toHaveBeenCalledWith(
        { firstName: 'Jane', lastName: 'Smith' },
        { queryRunner: mockQueryRunner },
      );
    });
  });

  describe('refreshTokens', () => {
    const mockUserId = randomUUID();
    const mockUser: UserEntity = {
      id: mockUserId,
      firstName: 'Test',
      lastName: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const mockAuthEntity: AuthEntity = {
      id: randomUUID(),
      userId: mockUser.id,
      login: 'testuser',
      password: 'hashedPassword1',
      refreshToken: 'hashedRefreshToken1',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: mockUser,
    };
    it('should successfully refresh tokens', async () => {
      const authRepositoryFindOneBySpy = jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(mockAuthEntity);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('new-access-token');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('new-refresh-token');
      jest.spyOn(authRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.refreshTokens(mockUserId, 'valid-refresh-token');

      expect(authRepositoryFindOneBySpy).toHaveBeenCalledWith({ userId: mockUserId });
      expect(bcrypt.compare).toHaveBeenCalledWith('valid-refresh-token', 'hashedRefreshToken1');
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException if credentials are not found', async () => {
      const authRepositoryFindOneBySpy = jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.refreshTokens(mockUserId, 'token')).rejects.toThrow(UnauthorizedException);
      expect(authRepositoryFindOneBySpy).toHaveBeenCalledWith({ userId: mockUserId });
    });

    it('should throw UnauthorizedException if refresh token is missing', async () => {
      const authRepositoryFindOneBySpy = jest.spyOn(authRepository, 'findOneBy').mockResolvedValue({
        ...mockAuthEntity,
        refreshToken: null,
      });

      await expect(service.refreshTokens(mockUserId, 'token')).rejects.toThrow(UnauthorizedException);
      expect(authRepositoryFindOneBySpy).toHaveBeenCalledWith({ userId: mockUserId });
    });

    it('should throw UnauthorizedException if refresh token does not match', async () => {
      const authRepositoryFindOneBySpy = jest.spyOn(authRepository, 'findOneBy').mockResolvedValue(mockAuthEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens(mockUserId, 'invalid-token')).rejects.toThrow(UnauthorizedException);
      expect(authRepositoryFindOneBySpy).toHaveBeenCalledWith({ userId: mockUserId });
      expect(bcrypt.compare).toHaveBeenCalledWith('invalid-token', 'hashedRefreshToken1');
    });
  });
});
