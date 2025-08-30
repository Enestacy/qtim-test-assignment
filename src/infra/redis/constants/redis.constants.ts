export const REDIS_TTL_DEFAULT_INTERVAL = 3600; // 1 hour
export const REDIS_KEY_PREFIX = 'qtim:';

export enum RedisKeys {
  ARTICLE_CACHE_PREFIX = 'article',
  ARTICLE_LIST_CACHE_PREFIX = 'article_list',
}
