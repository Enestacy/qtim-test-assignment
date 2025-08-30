import { IsOptional } from 'class-validator';
import { BaseFilterDto } from '../../../common/filter.dto';
import { PaginationDto } from '../../../common/pagination.dto';
import { ArticleEntity } from '../article.entity';

export class ListArticleDto extends PaginationDto {
  @IsOptional()
  where?: BaseFilterDto<ArticleEntity>['where'];

  @IsOptional()
  orderBy?: BaseFilterDto<ArticleEntity>['orderBy'];
}
