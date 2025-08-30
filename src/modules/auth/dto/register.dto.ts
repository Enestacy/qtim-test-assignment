import { IsDefined, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { CreateUserDto } from 'src/modules/user/dtos';

export class RegisterDto extends CreateUserDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public login: string;

  @IsDefined()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  public password: string;
}
