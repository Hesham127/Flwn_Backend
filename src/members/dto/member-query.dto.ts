import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MemberTypeValues,MemberRoleValues,type MemberType, type MemberRole,
} from './create-member.dto.js';

const MemberStatusValues = ['ACTIVE', 'INACTIVE'] as const;
type MemberStatus = (typeof MemberStatusValues)[number];

export class MemberQueryDto {
  @ApiPropertyOptional({ enum: MemberTypeValues })
  @IsOptional()
  @IsEnum(MemberTypeValues)
  type?: MemberType;

  @ApiPropertyOptional({ enum: MemberRoleValues })
  @IsOptional()
  @IsEnum(MemberRoleValues)
  role?: MemberRole;

  @ApiPropertyOptional({ enum: MemberStatusValues })
  @IsOptional()
  @IsEnum(MemberStatusValues)
  status?: MemberStatus;

  @ApiPropertyOptional({ example: 'anas' })
  @IsOptional()
  @IsString()
  search?: string;
}