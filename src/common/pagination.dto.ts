import { IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE } from './constants';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(MAX_BATCH_SIZE)
  @Type(() => Number)
  limit?: number = DEFAULT_BATCH_SIZE;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
