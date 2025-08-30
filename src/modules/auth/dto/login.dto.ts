import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public login: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public password: string;
}
