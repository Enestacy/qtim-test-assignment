import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from 'src/common/filters';

export async function createTestingApp(): Promise<{ app: INestApplication }> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({}));
  app.useGlobalFilters(new ValidationExceptionFilter());
  app.enableShutdownHooks();

  await app.init();

  return { app };
}
