import { IsDefined, IsString, MaxLength } from 'class-validator';
import { UserEntity } from '../user.entity';

export class CreateUserDto implements Partial<UserEntity> {
  @IsDefined()
  @IsString()
  @MaxLength(250, { message: 'First name is too long. Max 250 characters' })
  public firstName: string;

  @IsDefined()
  @IsString()
  @MaxLength(250, { message: 'Last name is too long. Max 250 characters' })
  public lastName: string;
}
