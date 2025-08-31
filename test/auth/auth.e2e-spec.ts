import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthEntity } from 'src/modules/auth/auth.entity';
import { UserEntity } from 'src/modules/user/user.entity';
import { createTestingApp, makeRequest } from 'test/helpers';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createUser, UserFactory, createAuth, AuthFactory, defaultPassword, defaultRefreshToken } from '../factories';
import createToken from 'test/helpers/create-token.helper';
import { ConfigService } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authRepository: Repository<AuthEntity>;
  let userRepository: Repository<UserEntity>;
  let configService: ConfigService;

  beforeAll(async () => {
    ({ app } = await createTestingApp());
    authRepository = app.get(getRepositoryToken(AuthEntity));
    userRepository = app.get(getRepositoryToken(UserEntity));
    configService = app.get(ConfigService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(async () => {
    await authRepository.createQueryBuilder().delete().from(AuthEntity).execute();
    await userRepository.createQueryBuilder().delete().from(UserEntity).execute();
    jest.clearAllMocks();
  });

  describe('/auth/register', () => {
    it('should successfully register user', async () => {
      const requestBody = {
        login: 'testuser',
        password: 'qweQwe123!',
        firstName: 'John',
        lastName: 'Doe',
      };
      const expectedResponse = {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/register',
        expectedStatus: 201,
        body: requestBody,
        expectedResponse,
      });
    });

    it('should return error if user already exists', async () => {
      const userEntity = UserFactory.build({
        firstName: 'Jane',
        lastName: 'Smith',
      });
      await createUser(userRepository, userEntity);

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
        login: 'testuser',
        password: 'qweQwe123!',
      });
      await createAuth(authRepository, authEntity);

      const requestBody = {
        login: 'testuser',
        password: 'qweQwe123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const expectedResponse = {
        statusCode: 409,
        error: 'Conflict',
        message: 'User with this login already exists',
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/register',
        expectedStatus: 409,
        body: requestBody,
        expectedResponse,
      });
    });

    it('should return error on invalid request body (login is not provided)', async () => {
      const requestBody = {
        password: 'qweQwe123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const expectedResponse = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'login should not be null or undefined',
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/register',
        expectedStatus: 400,
        body: requestBody,
        expectedResponse,
      });
    });
  });

  describe('/auth/login', () => {
    it('should successfully login user', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
      });
      await createAuth(authRepository, authEntity);

      const requestBody = {
        login: 'testuser',
        password: defaultPassword,
      };

      const expectedResponse = {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/login',
        expectedStatus: 200,
        body: requestBody,
        expectedResponse,
      });
    });

    it('should return error if user does not exist', async () => {
      const requestBody = {
        login: 'thisUserDoesNotExistLogin',
        password: 'qweQwe123!',
      };
      const expectedResponse = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'TEXT TO RUIN TEST',
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/login',
        expectedStatus: 401,
        body: requestBody,
        expectedResponse,
      });
    });

    it('should return error if password is incorrect', async () => {
      const userEntity = UserFactory.build({
        firstName: 'Tom',
        lastName: 'Brown',
      });
      await createUser(userRepository, userEntity);

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
        login: 'tomBrownLogin',
        password: 'qweQwe123!',
      });
      await createAuth(authRepository, authEntity);

      const requestBody = {
        login: 'tomBrownLogin',
        password: 'InvalidPassword321!',
      };
      const expectedResponse = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials(password)',
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/login',
        expectedStatus: 401,
        body: requestBody,
        expectedResponse,
      });
    });
  });

  describe('/auth/refresh', () => {
    it('should successfully refresh tokens', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const { token: refreshToken } = await createToken(
        {
          userId: userEntity.id,
        },
        {
          expiresIn: configService.get('service.jwt.refreshExpires'),
          secret: configService.get('service.jwt.secret'),
        },
      );
      const authEntity = AuthFactory.build({
        userId: userEntity.id,
        login: 'testuser',
        refreshTokenToHash: refreshToken,
      });
      await createAuth(authRepository, authEntity);

      const requestHeaders = {
        Refresh: refreshToken,
      };

      const expectedResponse = {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/refresh',
        expectedStatus: 200,
        expectedResponse,
        headers: requestHeaders,
      });
    });

    it('should return error if refresh token is invalid', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
      });
      await createAuth(authRepository, authEntity);

      const requestHeaders = {
        Refresh: 'InvalidRefreshToken',
      };
      const expectedResponse = {
        statusCode: 401,
        message: 'Unauthorized',
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/refresh',
        expectedStatus: 401,
        expectedResponse,
        headers: requestHeaders,
      });
    });
  });

  describe('/auth/logout', () => {
    it('should successfully logout user', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const { token: accessToken } = await createToken(
        {
          userId: userEntity.id,
        },
        {
          expiresIn: configService.get('service.jwt.accessExpires'),
          secret: configService.get('service.jwt.secret'),
        },
      );

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
        login: 'testuser',
        refreshTokenToHash: defaultRefreshToken,
      });
      await createAuth(authRepository, authEntity);

      const requestHeaders = {
        Authorization: `Bearer ${accessToken}`,
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/logout',
        expectedStatus: 204,
        headers: requestHeaders,
      });
    });

    it('should return error if access token is not provided', async () => {
      const expectedResponse = {
        statusCode: 401,
        message: 'Unauthorized',
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/auth/logout',
        expectedStatus: 401,
        expectedResponse,
      });
    });
  });
});
