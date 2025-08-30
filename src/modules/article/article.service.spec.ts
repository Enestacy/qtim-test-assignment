import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleRepository } from './article.repository';
import { RedisService } from '../../infra/redis/redis.service';
import { CreateArticleDto, UpdateArticleDto, ListArticleDto } from './dtos';
import { ArticleWithAuthor } from './types/article.types';
import { ArticleEntity } from './article.entity';
import { randomUUID } from 'crypto';
import { REDIS_TTL_DEFAULT_INTERVAL, RedisKeys } from '../../infra/redis/constants';
import { buildRedisKey } from '../../common/helpers/build-redis-key.helper';

describe('ArticleService', () => {
  let service: ArticleService;
  let articleRepository: jest.Mocked<ArticleRepository>;
  let redisService: jest.Mocked<RedisService>;

  const mockArticle: ArticleEntity = {
    id: randomUUID(),
    authorId: 'user-1',
    title: 'Test Article',
    description: 'Test Description',
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    author: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  };

  const mockArticleWithAuthor: ArticleWithAuthor = {
    id: mockArticle.id,
    title: mockArticle.title,
    description: mockArticle.description,
    publishedAt: mockArticle.publishedAt,
    createdAt: mockArticle.createdAt,
    author: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ArticleRepository,
          useValue: {
            create: jest.fn(),
            findByWithAuthor: jest.fn(),
            update: jest.fn(),
            findBy: jest.fn(),
            delete: jest.fn(),
            findAndCountAll: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            setTTL: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
            delMultiple: jest.fn(),
          },
        },
        Logger,
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    articleRepository = module.get(ArticleRepository);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createArticleDto: CreateArticleDto = {
      title: 'New Article',
      description: 'New Description',
      publishedAt: new Date('2024-01-01'),
    };
    const authorId = 'user-1';

    it('should successfully create article and invalidate list cache', async () => {
      const articleRepositoryCreateSpy = jest.spyOn(articleRepository, 'create').mockResolvedValue(mockArticle);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(mockArticleWithAuthor);
      const redisKeysSpy = jest.spyOn(redisService, 'keys').mockResolvedValue([]);

      const result = await service.create(createArticleDto, authorId);

      expect(articleRepositoryCreateSpy).toHaveBeenCalledWith({
        ...createArticleDto,
        authorId,
      });
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: mockArticle.id });
      expect(redisKeysSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, '*'));
      expect(result).toEqual(mockArticleWithAuthor);
    });

    it('should throw InternalServerErrorException if article creation fails', async () => {
      const articleRepositoryCreateSpy = jest.spyOn(articleRepository, 'create').mockResolvedValue(null);

      await expect(service.create(createArticleDto, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryCreateSpy).toHaveBeenCalledWith({
        ...createArticleDto,
        authorId,
      });
    });

    it('should throw InternalServerErrorException if repository throws error', async () => {
      const error = new Error('Database error');
      const articleRepositoryCreateSpy = jest.spyOn(articleRepository, 'create').mockRejectedValue(error);

      await expect(service.create(createArticleDto, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryCreateSpy).toHaveBeenCalledWith({
        ...createArticleDto,
        authorId,
      });
    });
  });

  describe('update', () => {
    const articleId = 'article-1';
    const updateArticleDto: UpdateArticleDto = {
      title: 'Updated Article',
      description: 'Updated Description',
    };
    const authorId = 'user-1';

    it('should successfully update article and invalidate caches', async () => {
      const articleRepositoryUpdateSpy = jest
        .spyOn(articleRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(mockArticleWithAuthor);
      const redisDelSpy = jest.spyOn(redisService, 'del').mockResolvedValue(1);
      const redisKeysSpy = jest.spyOn(redisService, 'keys').mockResolvedValue([]);

      const result = await service.update(articleId, updateArticleDto, authorId);

      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
      expect(redisDelSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      expect(redisKeysSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, '*'));
      expect(result).toEqual(mockArticleWithAuthor);
    });

    it('should throw InternalServerErrorException if update fails', async () => {
      const articleRepositoryUpdateSpy = jest.spyOn(articleRepository, 'update').mockResolvedValue(null);

      await expect(service.update(articleId, updateArticleDto, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
    });

    it('should throw NotFoundException if no rows affected', async () => {
      const articleRepositoryUpdateSpy = jest
        .spyOn(articleRepository, 'update')
        .mockResolvedValue({ affected: 0 } as any);

      await expect(service.update(articleId, updateArticleDto, authorId)).rejects.toThrow(NotFoundException);
      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
    });

    it('should throw NotFoundException if article not found after update', async () => {
      const articleRepositoryUpdateSpy = jest
        .spyOn(articleRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(null);

      await expect(service.update(articleId, updateArticleDto, authorId)).rejects.toThrow(NotFoundException);
      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
    });

    it('should pass error from repository', async () => {
      const error = new Error('Database error');
      const articleRepositoryUpdateSpy = jest.spyOn(articleRepository, 'update').mockRejectedValue(error);

      await expect(service.update(articleId, updateArticleDto, authorId)).rejects.toThrow(error);
      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
    });
  });

  describe('delete', () => {
    const articleId = 'article-1';
    const authorId = 'user-1';

    it('should successfully delete article and invalidate caches', async () => {
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(mockArticle);
      const articleRepositoryDeleteSpy = jest
        .spyOn(articleRepository, 'delete')
        .mockResolvedValue({ affected: 1 } as any);
      const redisDelSpy = jest.spyOn(redisService, 'del').mockResolvedValue(1);
      const redisKeysSpy = jest.spyOn(redisService, 'keys').mockResolvedValue([]);

      const result = await service.delete(articleId, authorId);

      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(articleRepositoryDeleteSpy).toHaveBeenCalledWith({ id: articleId, authorId });
      expect(redisDelSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      expect(redisKeysSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, '*'));
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if article not found', async () => {
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(null);

      await expect(service.delete(articleId, authorId)).rejects.toThrow(NotFoundException);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const differentAuthorId = 'user-2';
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(mockArticle);

      await expect(service.delete(articleId, differentAuthorId)).rejects.toThrow(ForbiddenException);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
    });

    it('should throw InternalServerErrorException if delete fails', async () => {
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(mockArticle);
      const articleRepositoryDeleteSpy = jest.spyOn(articleRepository, 'delete').mockResolvedValue(null);

      await expect(service.delete(articleId, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(articleRepositoryDeleteSpy).toHaveBeenCalledWith({ id: articleId, authorId });
    });

    it('should throw InternalServerErrorException if no rows affected', async () => {
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(mockArticle);
      const articleRepositoryDeleteSpy = jest
        .spyOn(articleRepository, 'delete')
        .mockResolvedValue({ affected: 0 } as any);

      await expect(service.delete(articleId, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(articleRepositoryDeleteSpy).toHaveBeenCalledWith({ id: articleId, authorId });
    });

    it('should pass error from repository', async () => {
      const error = new Error('Database error');
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockRejectedValue(error);

      await expect(service.delete(articleId, authorId)).rejects.toThrow(error);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
    });
  });

  describe('findById', () => {
    const articleId = 'article-1';

    it('should return cached article when available', async () => {
      const cachedData = JSON.stringify(mockArticleWithAuthor);
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(cachedData);

      const result = await service.findById(articleId);

      expect(redisGetSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      expect(result).toEqual(mockArticleWithAuthor);
    });

    it('should fetch from database and cache when not in cache', async () => {
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(mockArticleWithAuthor);
      const redisSetTTLSpy = jest.spyOn(redisService, 'setTTL').mockResolvedValue('OK');

      const result = await service.findById(articleId);

      expect(redisGetSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
      expect(redisSetTTLSpy).toHaveBeenCalledWith(
        buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId),
        JSON.stringify(mockArticleWithAuthor),
        REDIS_TTL_DEFAULT_INTERVAL,
      );
      expect(result).toEqual(mockArticleWithAuthor);
    });

    it('should handle cache set error gracefully', async () => {
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(mockArticleWithAuthor);
      const redisSetTTLSpy = jest.spyOn(redisService, 'setTTL').mockRejectedValue(new Error('Redis error'));

      const result = await service.findById(articleId);

      expect(redisGetSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
      expect(redisSetTTLSpy).toHaveBeenCalledWith(
        buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId),
        JSON.stringify(mockArticleWithAuthor),
        REDIS_TTL_DEFAULT_INTERVAL,
      );
      expect(result).toEqual(mockArticleWithAuthor);
    });

    it('should throw NotFoundException if article not found', async () => {
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(null);

      await expect(service.findById(articleId)).rejects.toThrow(NotFoundException);
      expect(redisGetSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
    });

    it('should pass error from repository', async () => {
      const error = new Error('Database error');
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockRejectedValue(error);

      await expect(service.findById(articleId)).rejects.toThrow(error);
      expect(redisGetSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
    });
  });

  describe('list', () => {
    const listArticleDto: ListArticleDto = {
      limit: 10,
      offset: 0,
      where: {
        title: {
          contains: 'test',
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    };

    it('should return cached list when available', async () => {
      const mockResponse = {
        data: [mockArticleWithAuthor],
        total: 1,
      };
      const cachedData = JSON.stringify(mockResponse);
      const queryString = JSON.stringify(listArticleDto);
      const cacheKey = buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, Buffer.from(queryString).toString('base64'));
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(cachedData);

      const result = await service.list(listArticleDto);

      expect(redisGetSpy).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(mockResponse);
    });

    it('should fetch from database and cache when not in cache', async () => {
      const mockResponse = {
        data: [mockArticleWithAuthor],
        total: 1,
      };
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const articleRepositoryFindAndCountAllSpy = jest
        .spyOn(articleRepository, 'findAndCountAll')
        .mockResolvedValue([[mockArticleWithAuthor as ArticleEntity], 1]);
      const redisSetTTLSpy = jest.spyOn(redisService, 'setTTL').mockResolvedValue('OK');

      const result = await service.list(listArticleDto);

      const queryString = JSON.stringify(listArticleDto);
      const cacheKey = buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, Buffer.from(queryString).toString('base64'));
      expect(redisGetSpy).toHaveBeenCalledWith(cacheKey);
      expect(articleRepositoryFindAndCountAllSpy).toHaveBeenCalledWith({
        where: expect.any(Object),
        order: expect.any(Object),
        skip: 0,
        take: 10,
        relations: ['author'],
        select: {
          id: true,
          title: true,
          description: true,
          publishedAt: true,
          createdAt: true,
          author: { id: true, firstName: true, lastName: true },
        },
      });
      expect(redisSetTTLSpy).toHaveBeenCalledWith(cacheKey, JSON.stringify(mockResponse), REDIS_TTL_DEFAULT_INTERVAL);
      expect(result).toEqual(mockResponse);
    });

    it('should handle cache set error gracefully', async () => {
      const mockResponse = {
        data: [mockArticleWithAuthor],
        total: 1,
      };
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const articleRepositoryFindAndCountAllSpy = jest
        .spyOn(articleRepository, 'findAndCountAll')
        .mockResolvedValue([[mockArticleWithAuthor as ArticleEntity], 1]);
      const redisSetTTLSpy = jest.spyOn(redisService, 'setTTL').mockRejectedValue(new Error('Redis error'));

      const result = await service.list(listArticleDto);

      const queryString = JSON.stringify(listArticleDto);
      const cacheKey = buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, Buffer.from(queryString).toString('base64'));
      expect(redisGetSpy).toHaveBeenCalledWith(cacheKey);
      expect(articleRepositoryFindAndCountAllSpy).toHaveBeenCalled();
      expect(redisSetTTLSpy).toHaveBeenCalledWith(cacheKey, JSON.stringify(mockResponse), REDIS_TTL_DEFAULT_INTERVAL);
      expect(result).toEqual(mockResponse);
    });

    it('should use default values when not provided', async () => {
      const listArticleDtoWithoutDefaults: ListArticleDto = {};
      const mockResponse = {
        data: [],
        total: 0,
      };
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const articleRepositoryFindAndCountAllSpy = jest
        .spyOn(articleRepository, 'findAndCountAll')
        .mockResolvedValue([[], 0]);

      const result = await service.list(listArticleDtoWithoutDefaults);

      const queryString = JSON.stringify(listArticleDtoWithoutDefaults);
      const cacheKey = buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, Buffer.from(queryString).toString('base64'));
      expect(redisGetSpy).toHaveBeenCalledWith(cacheKey);
      expect(articleRepositoryFindAndCountAllSpy).toHaveBeenCalledWith({
        where: expect.any(Object),
        order: expect.any(Object),
        skip: 0,
        take: 20,
        relations: ['author'],
        select: {
          id: true,
          title: true,
          description: true,
          publishedAt: true,
          createdAt: true,
          author: { id: true, firstName: true, lastName: true },
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass error from repository', async () => {
      const error = new Error('Database error');
      const redisGetSpy = jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const articleRepositoryFindAndCountAllSpy = jest
        .spyOn(articleRepository, 'findAndCountAll')
        .mockRejectedValue(error);

      await expect(service.list(listArticleDto)).rejects.toThrow(error);
      expect(redisGetSpy).toHaveBeenCalled();
      expect(articleRepositoryFindAndCountAllSpy).toHaveBeenCalled();
    });
  });

  describe('cache methods', () => {
    describe('getArticleCacheKey', () => {
      it('should generate correct cache key for article', () => {
        const articleId = 'test-article-id';
        const result = (service as any).getArticleCacheKey(articleId);
        expect(result).toBe(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      });
    });

    describe('getArticleListCacheKey', () => {
      it('should generate correct cache key for article list', () => {
        const query: ListArticleDto = { limit: 10, offset: 0 };
        const result = (service as any).getArticleListCacheKey(query);
        const queryString = JSON.stringify(query);
        const expectedKey = buildRedisKey(
          RedisKeys.ARTICLE_LIST_CACHE_PREFIX,
          Buffer.from(queryString).toString('base64'),
        );
        expect(result).toBe(expectedKey);
      });
    });

    describe('invalidateArticleCache', () => {
      it('should successfully invalidate article cache', async () => {
        const articleId = 'test-article-id';
        const redisDelSpy = jest.spyOn(redisService, 'del').mockResolvedValue(1);

        await (service as any).invalidateArticleCache(articleId);

        expect(redisDelSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      });

      it('should handle redis error gracefully', async () => {
        const articleId = 'test-article-id';
        const redisDelSpy = jest.spyOn(redisService, 'del').mockRejectedValue(new Error('Redis error'));

        await expect((service as any).invalidateArticleCache(articleId)).resolves.toBeUndefined();
        expect(redisDelSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, articleId));
      });
    });

    describe('invalidateArticleListCache', () => {
      it('should successfully invalidate article list cache', async () => {
        const cacheKeys = ['key1', 'key2'];
        const redisKeysSpy = jest.spyOn(redisService, 'keys').mockResolvedValue(cacheKeys);
        const redisDelMultipleSpy = jest.spyOn(redisService, 'delMultiple').mockResolvedValue(2);

        await (service as any).invalidateArticleListCache();

        expect(redisKeysSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, '*'));
        expect(redisDelMultipleSpy).toHaveBeenCalledWith(cacheKeys);
      });

      it('should handle empty cache keys', async () => {
        const redisKeysSpy = jest.spyOn(redisService, 'keys').mockResolvedValue([]);
        const redisDelMultipleSpy = jest.spyOn(redisService, 'delMultiple').mockResolvedValue(0);

        await (service as any).invalidateArticleListCache();

        expect(redisKeysSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, '*'));
        expect(redisDelMultipleSpy).not.toHaveBeenCalled();
      });

      it('should handle redis error gracefully', async () => {
        const redisKeysSpy = jest.spyOn(redisService, 'keys').mockRejectedValue(new Error('Redis error'));

        await expect((service as any).invalidateArticleListCache()).resolves.toBeUndefined();
        expect(redisKeysSpy).toHaveBeenCalledWith(buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, '*'));
      });
    });
  });
});
