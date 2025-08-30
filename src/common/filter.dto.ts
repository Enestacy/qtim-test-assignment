import { IsOptional, IsObject, ValidateNested, IsArray, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterCondition {
  @IsOptional()
  equals?: any;

  @IsOptional()
  @IsArray()
  in?: any[];

  @IsOptional()
  @IsArray()
  notIn?: any[];

  @IsOptional()
  @IsNumber()
  lt?: number;

  @IsOptional()
  @IsNumber()
  lte?: number;

  @IsOptional()
  @IsNumber()
  gt?: number;

  @IsOptional()
  @IsNumber()
  gte?: number;

  @IsOptional()
  @IsString()
  contains?: string;

  @IsOptional()
  @IsString()
  startsWith?: string;

  @IsOptional()
  @IsString()
  endsWith?: string;

  @IsOptional()
  @IsDateString()
  ltDate?: string;

  @IsOptional()
  @IsDateString()
  lteDate?: string;

  @IsOptional()
  @IsDateString()
  gtDate?: string;

  @IsOptional()
  @IsDateString()
  gteDate?: string;
}

export class BaseFilterDto<T> {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterCondition)
  where?: {
    [key in keyof T]: FilterCondition;
  };

  @IsOptional()
  orderBy?: {
    [key in keyof T]: 'asc' | 'desc';
  };
}
