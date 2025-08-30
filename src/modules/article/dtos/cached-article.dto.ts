import { IsString, IsDate, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CachedAuthorDto {
  @IsString()
  id: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

export class CachedArticleDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDate()
  @Type(() => Date)
  publishedAt: Date;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ValidateNested()
  @Type(() => CachedAuthorDto)
  author: CachedAuthorDto;
}

export class CachedArticleListDto {
  @ValidateNested({ each: true })
  @Type(() => CachedArticleDto)
  data: CachedArticleDto[];

  @IsOptional()
  total: number;
}
