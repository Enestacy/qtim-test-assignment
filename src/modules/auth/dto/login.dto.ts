import { IsDefined, IsString } from 'class-validator';

export class LoginDto {
  @IsDefined()
  @IsString()
  public login: string;

  @IsDefined()
  @IsString()
  public password: string;
}
