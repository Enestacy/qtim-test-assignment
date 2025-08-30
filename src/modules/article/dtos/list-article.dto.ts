import { IsIn, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FilterConditionDto } from '../../../common/filter.dto';
import { PaginationDto } from '../../../common/pagination.dto';
import { Type } from 'class-transformer';

class ArticleWhereFilterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterConditionDto)
  title?: FilterConditionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterConditionDto)
  description?: FilterConditionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterConditionDto)
  publishedAt?: FilterConditionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterConditionDto)
  authorId?: FilterConditionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterConditionDto)
  createdAt?: FilterConditionDto;
}

class OrderByDto {
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  publishedAt?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  title?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  createdAt?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  updatedAt?: 'asc' | 'desc';
}

export class ListArticleDto extends PaginationDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ArticleWhereFilterDto)
  where?: ArticleWhereFilterDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OrderByDto)
  orderBy?: OrderByDto;
}
