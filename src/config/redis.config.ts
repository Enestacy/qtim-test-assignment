import { registerAs } from '@nestjs/config';
import { RedisConfig } from './types';

export default registerAs('redis', (): RedisConfig => {
  return {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
  };
});
