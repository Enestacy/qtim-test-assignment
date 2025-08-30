import { UserEntity } from '../../user/user.entity';
import { ArticleEntity } from '../article.entity';

export type BaseArticle = Pick<ArticleEntity, 'id' | 'title' | 'description' | 'publishedAt' | 'createdAt'>;
export type ArticleWithAuthor = BaseArticle & {
  author: Pick<UserEntity, 'id' | 'firstName' | 'lastName'>;
};
