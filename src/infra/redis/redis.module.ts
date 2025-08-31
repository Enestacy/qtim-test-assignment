import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { RedisModule as LiaoliaotsRedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { RedisService } from './redis.service';

@Module({
  imports: [
    LiaoliaotsRedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<RedisModuleOptions> => {
        return {
          closeClient: true,
          config: {
            host: configService.getOrThrow('redis.host'),
            port: configService.getOrThrow('redis.port'),
            db: configService.get('app.env') === 'test' ? 1 : 0,
          },
        };
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
