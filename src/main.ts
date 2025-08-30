import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new ValidationExceptionFilter());

  const NODE_ENV = configService.getOrThrow('service.appEnv');
  const logLevels: LogLevel[] = ['error', 'warn', 'log', 'verbose'];
  if (NODE_ENV === 'development') {
    logLevels.push('debug');
  }
  app.useLogger(logLevels);

  const APP_PORT = configService.getOrThrow('service.appPort');
  await app.listen(APP_PORT);
}
bootstrap();
