import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import dbConfig from 'db/config/db-config';
import svcConfig from './config/svc.config';
import { UserModule } from './modules/user';
import { AuthModule } from './modules/auth';
import { HttpModule } from '@nestjs/axios';
import { ArticleModule } from './modules/article';
import redisConfig from './config/redis.config';
import { RedisModule } from './infra/redis';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}.local`, `.env.${process.env.NODE_ENV}`],
      isGlobal: true,
      cache: true,
      load: [svcConfig, dbConfig, redisConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<{ database: TypeOrmModuleOptions }, true>) => {
        const dbConfig = configService.get('database');
        return dbConfig;
      },
    }),
    RedisModule,
    UserModule,
    AuthModule,
    ArticleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
