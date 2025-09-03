import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ArticleRepository } from './article.repository';
import { CreateArticleDto, UpdateArticleDto, ListArticleDto, CachedArticleDto, CachedArticleListDto } from './dtos';
import { ArticleWithAuthor } from './types/article.types';
import { buildWhereCondition, buildOrderByCondition } from '../../common/helpers';
import { parseCachedData } from '../../common/helpers/parse-cached-data.helper';
import { ArticleEntity } from './article.entity';
import { RedisService } from '../../infra/redis/redis.service';
import { REDIS_TTL_DEFAULT_INTERVAL, RedisKeys } from 'src/infra/redis/constants';
import { buildRedisKey } from 'src/common/helpers/build-redis-key.helper';
import { DEFAULT_BATCH_SIZE } from 'src/common/constants';

@Injectable()
export class ArticleService {
  private readonly logger: Logger;
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly redisService: RedisService,
  ) {
    this.logger = new Logger(ArticleService.name);
  }

  async create(data: CreateArticleDto, authorId: string): Promise<ArticleWithAuthor> {
    try {
      const createdArticle = await this.articleRepository.create({ ...data, authorId });
      if (!createdArticle) {
        throw new InternalServerErrorException();
      }

      const articleWithAuthor = await this.articleRepository.findByWithAuthor({ id: createdArticle.id });

      await this.invalidateArticleListCache();

      return articleWithAuthor;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Failed to create article');
    }
  }

  async update(id: string, data: UpdateArticleDto, authorId: string): Promise<ArticleWithAuthor> {
    try {
      const updateResult = await this.articleRepository.update({ id, authorId }, data);
      if (!updateResult) {
        throw new InternalServerErrorException('Failed to update article');
      }
      if (updateResult?.affected === 0) {
        throw new NotFoundException('Article not found');
      }
      const entity = await this.articleRepository.findByWithAuthor({
        id,
      });
      if (!entity) {
        throw new NotFoundException('Article not found');
      }

      await Promise.all([this.invalidateArticleCache(id), this.invalidateArticleListCache()]);

      return entity;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async delete(id: string, authorId: string): Promise<void> {
    try {
      const article = await this.articleRepository.findBy({ where: { id } });
      if (!article) {
        throw new NotFoundException('Article not found');
      }
      if (article.authorId !== authorId) {
        throw new ForbiddenException('You are not permitted to delete this article');
      }
      const deleteResult = await this.articleRepository.delete({ id, authorId });
      if (!deleteResult || deleteResult?.affected === 0) {
        throw new InternalServerErrorException('Failed to delete article');
      }

      await Promise.all([this.invalidateArticleCache(id), this.invalidateArticleListCache()]);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async findById(id: string): Promise<ArticleWithAuthor> {
    try {
      const cacheKey = this.getArticleCacheKey(id);

      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        this.logger.debug(`Article cache hit for ID: ${id}`);
        const validatedData = parseCachedData<CachedArticleDto>(cachedData, CachedArticleDto);
        if (!validatedData) {
          throw new InternalServerErrorException('Failed to parse cached data');
        }
        return validatedData;
      }

      const entity = await this.articleRepository.findByWithAuthor({
        id,
      });

      if (!entity) {
        throw new NotFoundException('Article not found');
      }

      try {
        await this.redisService.setTTL(cacheKey, JSON.stringify(entity), REDIS_TTL_DEFAULT_INTERVAL);
        this.logger.debug(`Article cached for ID: ${id}`);
      } catch (cacheError) {
        this.logger.error(`Failed to cache article for ID ${id}: ${cacheError.message}`);
      }

      return entity;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async list(query: ListArticleDto): Promise<{ data: ArticleWithAuthor[]; total: number }> {
    try {
      const cacheKey = this.getArticleListCacheKey(query);

      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        this.logger.debug(`Article list cache hit for query: ${JSON.stringify(query)}`);
        const validatedData = parseCachedData<CachedArticleListDto>(cachedData, CachedArticleListDto);
        if (!validatedData) {
          throw new InternalServerErrorException('Failed to parse cached data');
        }
        return validatedData;
      }

      const { limit = DEFAULT_BATCH_SIZE, offset = 0, where, orderBy } = query;

      const whereCondition = buildWhereCondition<ArticleEntity>(where);
      const orderByCondition = buildOrderByCondition<ArticleEntity>(orderBy);

      const [entities, total] = await this.articleRepository.findAndCountAll({
        where: whereCondition,
        order: orderByCondition,
        skip: offset,
        take: limit,
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

      const result = {
        data: entities,
        total,
      };

      try {
        await this.redisService.setTTL(cacheKey, JSON.stringify(result), REDIS_TTL_DEFAULT_INTERVAL);
        this.logger.debug(`Article list cached for query: ${JSON.stringify(query)}`);
      } catch (cacheError) {
        this.logger.error(`Failed to cache article list for query ${JSON.stringify(query)}: ${cacheError.message}`);
      }

      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  // cache methods

  private getArticleCacheKey(id: string): string {
    const cacheKey = buildRedisKey(RedisKeys.ARTICLE_CACHE_PREFIX, id);
    return cacheKey;
  }

  private getArticleListCacheKey(query: ListArticleDto): string {
    const queryString = JSON.stringify(query);
    const cacheKey = buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, Buffer.from(queryString).toString('base64'));
    return cacheKey;
  }

  private async invalidateArticleCache(id: string): Promise<void> {
    try {
      const cacheKey = this.getArticleCacheKey(id);
      await this.redisService.del(cacheKey);
      this.logger.debug(`Invalidated article cache for ID: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate article cache for ID ${id}: ${error.message}`);
    }
  }

  private async invalidateArticleListCache(): Promise<void> {
    try {
      const pattern = buildRedisKey(RedisKeys.ARTICLE_LIST_CACHE_PREFIX, '*');
      const keys = await this.redisService.keys(pattern);
      if (keys.length > 0) {
        const deletedCount = await this.redisService.delMultiple(keys);
        this.logger.debug(`Invalidated ${deletedCount} article list cache entries`);
      } else {
        this.logger.debug('No article list cache entries found to invalidate');
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate article list cache: ${error.message}`);
    }
  }
}
