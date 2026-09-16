import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TeamQueryDto {
  @ApiPropertyOptional({ example: 'Backend' })
  @IsOptional()
  @IsString()
  search?: string;
}