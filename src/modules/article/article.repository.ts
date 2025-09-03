import { Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { ArticleEntity } from './article.entity';
import { DataSource, DeleteResult, FindManyOptions, FindOneOptions, FindOptionsWhere, UpdateResult } from 'typeorm';
import { Transactional } from 'src/common/types';
import { getRepository } from 'src/common/helpers';
import { ArticleWithAuthor } from './types/article.types';

@Injectable()
export class ArticleRepository {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(ArticleEntity)
    private readonly datasource: DataSource,
  ) {
    this.logger = new Logger(ArticleRepository.name);
  }

  async findBy(
    options: FindOneOptions<ArticleEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<ArticleEntity | null> {
    try {
      const articleRepository = getRepository(activeQueryRunner ?? this.datasource, ArticleEntity);
      return articleRepository.findOne({
        withDeleted: false,
        ...options,
      });
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }

  async findAll(
    options: FindManyOptions<ArticleEntity> = {},
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<ArticleEntity[] | null> {
    try {
      const articleRepository = getRepository(activeQueryRunner ?? this.datasource, ArticleEntity);
      return articleRepository.find(options);
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }

  async findAndCountAll(
    options: FindManyOptions<ArticleEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<[ArticleEntity[], number]> {
    try {
      const articleRepository = getRepository(activeQueryRunner ?? this.datasource, ArticleEntity);
      return articleRepository.findAndCount(options);
    } catch (error) {
      this.logger.error(error.message);
      return [[], 0];
    }
  }

  async create(
    data: Partial<ArticleEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<ArticleEntity | null> {
    try {
      const articleRepository = getRepository(activeQueryRunner ?? this.datasource, ArticleEntity);
      const articleData = articleRepository.create(data);

      return articleRepository.save(articleData);
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }

  async update(
    where: FindOptionsWhere<ArticleEntity>,
    data: Partial<ArticleEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<UpdateResult | null> {
    try {
      const articleRepository = getRepository(activeQueryRunner ?? this.datasource, ArticleEntity);
      return articleRepository.update(where, data);
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }

  async delete(
    where: FindOptionsWhere<ArticleEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<DeleteResult | null> {
    try {
      const articleRepository = getRepository(activeQueryRunner ?? this.datasource, ArticleEntity);
      return articleRepository.delete(where);
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }

  async findByWithAuthor(
    where: FindOptionsWhere<ArticleEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<ArticleWithAuthor | null> {
    try {
      const articleRepository = getRepository(activeQueryRunner ?? this.datasource, ArticleEntity);
      return articleRepository.findOne({
        where,
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
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }
}
