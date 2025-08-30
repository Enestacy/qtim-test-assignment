import { REDIS_KEY_PREFIX, RedisKeys } from 'src/infra/redis/constants';

export const buildRedisKey = (type: RedisKeys, ...args: string[]): string => {
  return `${REDIS_KEY_PREFIX}${type}:${args.join(':')}`;
};
