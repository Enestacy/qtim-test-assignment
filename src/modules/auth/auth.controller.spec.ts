import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginRequest, RegisterRequest } from './auth.contracts';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockRegisterRequest: RegisterRequest = {
      login: 'newuser',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Smith',
    };
    it('should successfully register user', async () => {
      const authServiceRegisterSpy = jest.spyOn(authService, 'register').mockResolvedValue(mockTokens);

      const result = await controller.register(mockRegisterRequest);

      expect(authServiceRegisterSpy).toHaveBeenCalledWith(mockRegisterRequest);
      expect(result).toEqual(mockTokens);
    });

    it('should pass error from service', async () => {
      const error = new Error('Registration failed');
      const authServiceRegisterSpy = jest.spyOn(authService, 'register').mockRejectedValue(error);

      await expect(controller.register(mockRegisterRequest)).rejects.toThrow(error);
      expect(authServiceRegisterSpy).toHaveBeenCalledWith(mockRegisterRequest);
    });
  });

  describe('login', () => {
    const mockLoginRequest: LoginRequest = {
      login: 'testuser',
      password: 'password123',
    };
    it('should successfully login', async () => {
      const authServiceLoginSpy = jest.spyOn(authService, 'login').mockResolvedValue(mockTokens);

      const result = await controller.login(mockLoginRequest);

      expect(authServiceLoginSpy).toHaveBeenCalledWith(mockLoginRequest);
      expect(result).toEqual(mockTokens);
    });

    it('should pass error from service', async () => {
      const error = new Error('Login failed');
      const authServiceLoginSpy = jest.spyOn(authService, 'login').mockRejectedValue(error);

      await expect(controller.login(mockLoginRequest)).rejects.toThrow(error);
      expect(authServiceLoginSpy).toHaveBeenCalledWith(mockLoginRequest);
    });
  });

  describe('refreshTokens', () => {
    it('should successfully refresh tokens', async () => {
      const mockRequest = {
        user: {
          sub: 'user-1',
          refreshToken: 'valid-refresh-token',
        },
      } as unknown as Request;
      const authServiceRefreshTokensSpy = jest.spyOn(authService, 'refreshTokens').mockResolvedValue(mockTokens);

      const result = await controller.refreshTokens(mockRequest);

      expect(authServiceRefreshTokensSpy).toHaveBeenCalledWith('user-1', 'valid-refresh-token');
      expect(result).toEqual(mockTokens);
    });
    it('should pass error from service', async () => {
      const mockRequest = {
        user: {
          sub: 'user-1',
          refreshToken: 'invalid-token',
        },
      } as unknown as Request;
      const error = new Error('Token refresh failed');
      const authServiceRefreshTokensSpy = jest.spyOn(authService, 'refreshTokens').mockRejectedValue(error);

      await expect(controller.refreshTokens(mockRequest)).rejects.toThrow(error);
      expect(authServiceRefreshTokensSpy).toHaveBeenCalledWith('user-1', 'invalid-token');
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const mockRequest = {
        user: {
          sub: 'user-1',
        },
      } as unknown as Request;

      const authServiceLogoutSpy = jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest);

      expect(authServiceLogoutSpy).toHaveBeenCalledWith('user-1');
      expect(result).toBeUndefined();
    });

    it('should pass error from service', async () => {
      const mockRequest = {
        user: {
          sub: 'user-1',
        },
      } as unknown as Request;

      const error = new Error('Logout failed');
      const authServiceLogoutSpy = jest.spyOn(authService, 'logout').mockRejectedValue(error);

      await expect(controller.logout(mockRequest)).rejects.toThrow(error);
      expect(authServiceLogoutSpy).toHaveBeenCalledWith('user-1');
    });
  });
});
