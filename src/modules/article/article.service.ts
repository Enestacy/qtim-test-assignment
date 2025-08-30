import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ArticleRepository } from './article.repository';
import { CreateArticleDto, UpdateArticleDto, ListArticleDto } from './dtos';
import { ArticleWithAuthor } from './types/article.types';
import { buildWhereCondition, buildOrderByCondition } from '../../common/helpers';
import { ArticleEntity } from './article.entity';

@Injectable()
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly logger: Logger,
  ) {
    this.logger = new Logger(ArticleService.name);
  }

  async create(data: CreateArticleDto, authorId: string): Promise<ArticleWithAuthor> {
    try {
      const createdArticle = await this.articleRepository.create({ ...data, authorId });
      if (!createdArticle) {
        throw new InternalServerErrorException();
      }

      this.logger.log(`Article created: ${createdArticle}`);
      this.logger.debug(`Article created: ${JSON.stringify(createdArticle)}`);

      const articleWithAuthor = await this.articleRepository.findByWithAuthor({ id: createdArticle.id });

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
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async findById(id: string): Promise<ArticleWithAuthor> {
    try {
      const entity = await this.articleRepository.findByWithAuthor({
        id,
      });
      if (!entity) {
        throw new NotFoundException('Article not found');
      }
      return entity;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async list(query: ListArticleDto): Promise<{ data: ArticleWithAuthor[]; total: number }> {
    try {
      const { limit = 20, offset = 0, where, orderBy } = query;

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

      return {
        data: entities || [],
        total: total || 0,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
