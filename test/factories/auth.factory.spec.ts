import { randomUUID } from 'crypto';
import { Factory } from 'fishery';
import { AuthEntity } from 'src/modules/auth/auth.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

function hashPassword(password: string): string {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

class EntityFactory extends Factory<AuthEntity & { passwordToHash?: string; refreshTokenToHash?: string }> {}

export const defaultPassword = 'qweQwe123!';
export const defaultRefreshToken = 'refreshToken';

export const AuthFactory = EntityFactory.define(({ params }) => {
  const entity = new AuthEntity();
  entity.id = randomUUID();
  entity.login = 'testuser';

  entity.password = hashPassword(params.passwordToHash || defaultPassword);
  entity.refreshToken = hashPassword(params.refreshTokenToHash || defaultRefreshToken);

  entity.userId = randomUUID();

  return entity;
});

export function createAuth(repo: Repository<AuthEntity>, params?: Partial<AuthEntity>) {
  return repo.save(AuthFactory.build(params));
}
