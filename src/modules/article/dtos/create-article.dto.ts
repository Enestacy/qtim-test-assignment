import { IsDate, IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ArticleEntity } from '../article.entity';
import { Type } from 'class-transformer';

export class CreateArticleDto implements Partial<ArticleEntity> {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public description?: string;

  @IsDefined()
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  public publishedAt: Date;
}
