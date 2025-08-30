export type AppConfig = {
  appPort: string;
  appEnv: string;
  bcrypt: BcryptConfig;
  jwt: JwtConfig;
};

export type BcryptConfig = {
  salt: number;
};

export type JwtConfig = {
  secret: string;
  accessExpires: string;
  refreshExpires: string;
};
