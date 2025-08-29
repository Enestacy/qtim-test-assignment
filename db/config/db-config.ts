import { registerAs } from '@nestjs/config';

import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

import { NamingStrategy } from './db-naming.strategy';

export default registerAs(
  'database',
  (): DataSourceOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [join(__dirname, '../../**/*.entity.{ts,js}')],
    migrations: [join(__dirname, '../../db/migrations/*.{ts,js}')],
    namingStrategy: new NamingStrategy(),
    extra: {
      max: 10,
      connectionTimeoutMillis: 100000,
    },
    synchronize: false,
    migrationsRun: process.env.NODE_ENV !== 'development',
    logging: process.env.DB_LOGGING_ENABLED === 'true',
  }),
);
