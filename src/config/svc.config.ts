import { registerAs } from '@nestjs/config';

const getConfig = () => ({
  appPort: process.env.APP_PORT,
  appEnv: process.env.NODE_ENV,
});

export type AppConfig = ReturnType<typeof getConfig>;

export default registerAs('service', getConfig);
