import { randomUUID } from 'crypto';
import { Factory } from 'fishery';
import { ArticleEntity } from 'src/modules/article/article.entity';
import { Repository } from 'typeorm';

class EntityFactory extends Factory<ArticleEntity> {
  public deleted() {
    return this.params({
      deletedAt: new Date(),
    });
  }
}

export const ArticleFactory = EntityFactory.define(() => {
  const entity = new ArticleEntity();
  entity.id = randomUUID();
  entity.title = 'Test Article';
  entity.description = 'Test Description';
  entity.publishedAt = new Date('2024-01-01');
  entity.authorId = randomUUID();
  entity.createdAt = new Date();
  entity.updatedAt = new Date();
  entity.deletedAt = null;

  return entity;
});

export function createArticle(repo: Repository<ArticleEntity>, params?: Partial<ArticleEntity>) {
  return repo.save(ArticleFactory.build(params));
}
