import { randomUUID } from 'crypto';
import { Factory } from 'fishery';
import { UserEntity } from 'src/modules/user/user.entity';
import { Repository } from 'typeorm';

class EntityFactory extends Factory<UserEntity> {
  public deleted() {
    return this.params({
      deletedAt: new Date(),
    });
  }
}

export const UserFactory = EntityFactory.define(() => {
  const entity = new UserEntity();
  entity.id = randomUUID();
  entity.firstName = 'John';
  entity.lastName = 'Doe';
  entity.createdAt = new Date();
  entity.updatedAt = new Date();

  return entity;
});

export function createUser(repo: Repository<UserEntity>, params?: Partial<UserEntity>) {
  return repo.save(UserFactory.build(params));
}
