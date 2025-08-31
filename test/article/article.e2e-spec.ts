import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ArticleEntity } from 'src/modules/article/article.entity';
import { UserEntity } from 'src/modules/user/user.entity';
import { AuthEntity } from 'src/modules/auth/auth.entity';
import { createTestingApp, makeRequest } from 'test/helpers';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createUser, UserFactory, createAuth, AuthFactory, ArticleFactory, createArticle } from '../factories';
import createToken from 'test/helpers/create-token.helper';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from 'src/infra/redis/redis.service';

describe('ArticleController (e2e)', () => {
  let app: INestApplication;
  let articleRepository: Repository<ArticleEntity>;
  let userRepository: Repository<UserEntity>;
  let authRepository: Repository<AuthEntity>;
  let configService: ConfigService;
  let redisService: RedisService;

  beforeAll(async () => {
    ({ app } = await createTestingApp());
    articleRepository = app.get(getRepositoryToken(ArticleEntity));
    userRepository = app.get(getRepositoryToken(UserEntity));
    authRepository = app.get(getRepositoryToken(AuthEntity));
    configService = app.get(ConfigService);
    redisService = app.get(RedisService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(async () => {
    await articleRepository.createQueryBuilder().delete().from(ArticleEntity).execute();
    await authRepository.createQueryBuilder().delete().from(AuthEntity).execute();
    await userRepository.createQueryBuilder().delete().from(UserEntity).execute();
    await redisService.flushall();
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('/articles (GET)', () => {
    it('should return empty list when no articles exist', async () => {
      const expectedResponse = {
        data: [],
        total: 0,
      };

      await makeRequest({
        app,
        method: 'GET',
        route: '/articles',
        expectedStatus: 200,
        expectedResponse,
      });
    });

    it('should handle pagination correctly', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const articles = [];
      for (let i = 1; i <= 10; i++) {
        const articleEntity = ArticleFactory.build({
          authorId: userEntity.id,
          title: `Article ${i}`,
          description: `Description ${i}`,
        });
        const savedArticle = await createArticle(articleRepository, articleEntity);
        articles.push(savedArticle);
      }

      const firstPageResponse = await makeRequest({
        app,
        method: 'GET',
        route: '/articles?limit=2&offset=0',
        expectedStatus: 200,
      });

      expect(firstPageResponse.body.data).toHaveLength(2);
      expect(firstPageResponse.body.total).toBe(10);
      expect(firstPageResponse.body.data[0].title).toBe('Article 10');
      expect(firstPageResponse.body.data[1].title).toBe('Article 9');

      const secondPageResponse = await makeRequest({
        app,
        method: 'GET',
        route: '/articles?limit=2&offset=2',
        expectedStatus: 200,
      });

      expect(secondPageResponse.body.data).toHaveLength(2);
      expect(secondPageResponse.body.total).toBe(10);
      expect(secondPageResponse.body.data[0].title).toBe('Article 8');
      expect(secondPageResponse.body.data[1].title).toBe('Article 7');

      const lastPageResponse = await makeRequest({
        app,
        method: 'GET',
        route: '/articles?limit=10&offset=7',
        expectedStatus: 200,
      });

      expect(lastPageResponse.body.data).toHaveLength(3);
      expect(lastPageResponse.body.total).toBe(10);
      expect(lastPageResponse.body.data[0].title).toBe('Article 3');
      expect(lastPageResponse.body.data[1].title).toBe('Article 2');
      expect(lastPageResponse.body.data[2].title).toBe('Article 1');
    });

    it('should successfully list articles', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const articleEntity = ArticleFactory.build({ authorId: userEntity.id });
      await createArticle(articleRepository, articleEntity);

      const expectedResponse = {
        data: [
          {
            id: articleEntity.id,
            title: 'Test Article',
            description: 'Test Description',
            publishedAt: expect.any(String),
            createdAt: expect.any(String),
            author: {
              id: userEntity.id,
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        ],
        total: 1,
      };

      await makeRequest({
        app,
        method: 'GET',
        route: '/articles',
        expectedStatus: 200,
        expectedResponse,
      });
    });
  });

  describe('/articles/:id (GET)', () => {
    it('should successfully get article by id', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const articleEntity = ArticleFactory.build({ authorId: userEntity.id });
      await createArticle(articleRepository, articleEntity);

      const expectedResponse = {
        id: articleEntity.id,
        title: 'Test Article',
        description: 'Test Description',
        publishedAt: expect.any(String),
        createdAt: expect.any(String),
        author: {
          id: userEntity.id,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      await makeRequest({
        app,
        method: 'GET',
        route: `/articles/${articleEntity.id}`,
        expectedStatus: 200,
        expectedResponse,
      });
    });

    it('should return 404 when article not found', async () => {
      const nonExistentId = randomUUID();
      const expectedResponse = {
        statusCode: 404,
        error: 'Not Found',
        message: 'Article not found',
      };

      await makeRequest({
        app,
        method: 'GET',
        route: `/articles/${nonExistentId}`,
        expectedStatus: 404,
        expectedResponse,
      });
    });
  });

  describe('/articles (POST)', () => {
    it('should successfully create article when authenticated', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
      });
      await createAuth(authRepository, authEntity);

      const { token: accessToken } = await createToken(
        {
          userId: userEntity.id,
        },
        {
          expiresIn: configService.get('service.jwt.accessExpires'),
          secret: configService.get('service.jwt.secret'),
        },
      );

      const requestBody = {
        title: 'New Article',
        description: 'New Description',
        publishedAt: '2024-01-01',
      };

      const expectedResponse = {
        id: expect.any(String),
        title: 'New Article',
        description: 'New Description',
        publishedAt: expect.any(String),
        createdAt: expect.any(String),
        author: {
          id: userEntity.id,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/articles',
        expectedStatus: 201,
        body: requestBody,
        expectedResponse,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    });

    it('should return 401 when not authenticated', async () => {
      const requestBody = {
        title: 'New Article',
        description: 'New Description',
        publishedAt: '2024-01-01',
      };

      const expectedResponse = {
        statusCode: 401,
        message: 'Unauthorized',
      };

      await makeRequest({
        app,
        method: 'POST',
        route: '/articles',
        expectedStatus: 401,
        body: requestBody,
        expectedResponse,
      });
    });
  });

  describe('/articles/:id (PATCH)', () => {
    it('should successfully update article when authenticated and is author', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
      });
      await createAuth(authRepository, authEntity);

      const { token: accessToken } = await createToken(
        {
          userId: userEntity.id,
        },
        {
          expiresIn: configService.get('service.jwt.accessExpires'),
          secret: configService.get('service.jwt.secret'),
        },
      );

      const articleEntity = ArticleFactory.build({ authorId: userEntity.id });
      await createArticle(articleRepository, articleEntity);

      const requestBody = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const expectedResponse = {
        id: articleEntity.id,
        title: 'Updated Title',
        description: 'Updated Description',
        publishedAt: expect.any(String),
        createdAt: expect.any(String),
        author: {
          id: userEntity.id,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      await makeRequest({
        app,
        method: 'PATCH',
        route: `/articles/${articleEntity.id}`,
        expectedStatus: 200,
        body: requestBody,
        expectedResponse,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    });

    it('should return 401 when not authenticated', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const articleEntity = ArticleFactory.build({ authorId: userEntity.id });
      await createArticle(articleRepository, articleEntity);

      const requestBody = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const expectedResponse = {
        statusCode: 401,
        message: 'Unauthorized',
      };

      await makeRequest({
        app,
        method: 'PATCH',
        route: `/articles/${articleEntity.id}`,
        expectedStatus: 401,
        body: requestBody,
        expectedResponse,
      });
    });

    it('should return 404 when article not found', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
      });
      await createAuth(authRepository, authEntity);

      const { token: accessToken } = await createToken(
        {
          userId: userEntity.id,
        },
        {
          expiresIn: configService.get('service.jwt.accessExpires'),
          secret: configService.get('service.jwt.secret'),
        },
      );

      const nonExistentId = randomUUID();
      const requestBody = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const expectedResponse = {
        statusCode: 404,
        error: 'Not Found',
        message: 'Article not found',
      };

      await makeRequest({
        app,
        method: 'PATCH',
        route: `/articles/${nonExistentId}`,
        expectedStatus: 404,
        body: requestBody,
        expectedResponse,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    });
  });

  describe('/articles/:id (DELETE)', () => {
    it('should successfully delete article when authenticated and is author', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
      });
      await createAuth(authRepository, authEntity);

      const { token: accessToken } = await createToken(
        {
          userId: userEntity.id,
        },
        {
          expiresIn: configService.get('service.jwt.accessExpires'),
          secret: configService.get('service.jwt.secret'),
        },
      );

      const articleEntity = ArticleFactory.build({ authorId: userEntity.id });
      await createArticle(articleRepository, articleEntity);

      await makeRequest({
        app,
        method: 'DELETE',
        route: `/articles/${articleEntity.id}`,
        expectedStatus: 204,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const deletedArticle = await articleRepository.findOne({ where: { id: articleEntity.id } });
      expect(deletedArticle).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const articleEntity = ArticleFactory.build({ authorId: userEntity.id });
      await createArticle(articleRepository, articleEntity);

      const expectedResponse = {
        statusCode: 401,
        message: 'Unauthorized',
      };

      await makeRequest({
        app,
        method: 'DELETE',
        route: `/articles/${articleEntity.id}`,
        expectedStatus: 401,
        expectedResponse,
      });
    });

    it('should return 404 when article not found', async () => {
      const userEntity = UserFactory.build();
      await createUser(userRepository, userEntity);

      const authEntity = AuthFactory.build({
        userId: userEntity.id,
      });
      await createAuth(authRepository, authEntity);

      const { token: accessToken } = await createToken(
        {
          userId: userEntity.id,
        },
        {
          expiresIn: configService.get('service.jwt.accessExpires'),
          secret: configService.get('service.jwt.secret'),
        },
      );

      const nonExistentId = randomUUID();
      const expectedResponse = {
        statusCode: 404,
        error: 'Not Found',
        message: 'Article not found',
      };

      await makeRequest({
        app,
        method: 'DELETE',
        route: `/articles/${nonExistentId}`,
        expectedStatus: 404,
        expectedResponse,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    });
  });
});
