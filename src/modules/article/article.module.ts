import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './article.entity';
import { ArticleRepository } from './article.repository';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { RedisModule } from 'src/infra/redis';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity]), RedisModule],
  controllers: [ArticleController],
  providers: [ArticleRepository, ArticleService, Logger],
  exports: [ArticleService],
})
export class ArticleModule {}
