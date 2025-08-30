import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AuthEntity } from 'src/modules/auth/auth.entity';

export default async function createToken(
  payloadData: Pick<AuthEntity, 'userId' | 'login'>,
  tokenOptions: { expiresIn: JwtSignOptions['expiresIn']; secret: JwtSignOptions['secret'] },
): Promise<{ token: string }> {
  const jwtService = new JwtService();

  const payload = { sub: payloadData.userId, login: payloadData.login };
  const token = await jwtService.signAsync(payload, {
    secret: tokenOptions.secret,
    expiresIn: tokenOptions.expiresIn,
  });

  return { token };
}
