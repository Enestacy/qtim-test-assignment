import { IsDateString, IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ArticleEntity } from '../article.entity';

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
  @IsDateString()
  @IsNotEmpty()
  public publishedAt: string;
}
