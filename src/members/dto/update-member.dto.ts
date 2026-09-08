import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  MemberRoleValues,
  type MemberRole,
} from './create-member.dto.js';

const MemberStatusValues = ['ACTIVE', 'INACTIVE'] as const;
type MemberStatus = (typeof MemberStatusValues)[number];

export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 'Anas Ahmed' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: MemberRoleValues })
  @IsOptional()
  @IsEnum(MemberRoleValues)
  role?: MemberRole;

  @ApiPropertyOptional({ enum: MemberStatusValues })
  @IsOptional()
  @IsEnum(MemberStatusValues)
  status?: MemberStatus;
}