import { registerAs } from '@nestjs/config';

const getConfig = () => ({
  appPort: process.env.APP_PORT,
  appEnv: process.env.NODE_ENV,
  bcrypt: {
    salt: parseInt(process.env.SALT_ROUNDS, 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES,
  },
});

export type AppConfig = ReturnType<typeof getConfig>;

export default registerAs('service', getConfig);
