import { CreateArticleDto, UpdateArticleDto } from './dtos';
import { ArticleWithAuthor } from './types/article.types';

export class CreateArticleRequest extends CreateArticleDto {}
export type CreateArticleResponse = ArticleWithAuthor;

export class UpdateArticleRequest extends UpdateArticleDto {}
export type UpdateArticleResponse = ArticleWithAuthor;

export type ListArticleResponse = {
  data: ArticleWithAuthor[];
  total: number;
};

export type GetArticleByIdResponse = ArticleWithAuthor;

export type DeleteArticleResponse = void;
