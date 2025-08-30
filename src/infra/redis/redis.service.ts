import { Injectable } from '@nestjs/common';
import { RedisService as LiaoliaotsRedisService, DEFAULT_REDIS } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis | null;

  constructor(private readonly redisService: LiaoliaotsRedisService) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS);
  }

  // default redis methods

  async set(key: string, value: number | string) {
    return await this.redis.set(key, value);
  }

  async get(key: string) {
    return await this.redis.get(key);
  }

  async del(key: string) {
    return await this.redis.del(key);
  }

  // for temporary data

  async setTTL(key: string, value: number | string, ttl: number) {
    return await this.redis.set(key, value, 'EX', ttl);
  }

  // for working with pattern keys
  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  async delMultiple(keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    return await this.redis.del(...keys);
  }

  async flushall(): Promise<string> {
    return await this.redis.flushall();
  }
}
