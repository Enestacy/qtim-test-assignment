import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateBy,
  ValidateIf,
  ValidationArguments,
} from 'class-validator';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public title?: string;

  @IsOptional()
  @ValidateIf(o => o.description !== null)
  @IsString()
  public description?: string | null;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  public publishedAt?: string;

  @ValidateBy({
    name: 'hasAtLeastOneField',
    validator: {
      validate: (value: any, args: ValidationArguments) => {
        const obj = args.object as UpdateArticleDto;
        return Object.keys(obj).length > 0;
      },
      defaultMessage: () => 'At least one field must be provided',
    },
  })
  public _?: any;
}
