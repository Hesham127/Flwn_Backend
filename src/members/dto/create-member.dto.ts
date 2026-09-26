import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ---------- VALUES (for runtime) ----------
export const MemberTypeValues = ['HUMAN', 'AI'] as const;
export const MemberRoleValues = ['TEAM_LEAD', 'DEVELOPER', 'AI_DEVELOPER'] as const;

// ---------- TYPES (for compile-time) ----------
export type MemberType = (typeof MemberTypeValues)[number];
export type MemberRole = (typeof MemberRoleValues)[number];

export class CreateMemberDto {
  @ApiProperty({ example: 'Anas Abuelhaag' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'anas@flwn.ai' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ enum: MemberTypeValues, example: 'HUMAN' })
  @IsEnum(MemberTypeValues)
  @IsOptional()
  type?: MemberType;

  @ApiPropertyOptional({ enum: MemberRoleValues, example: 'DEVELOPER' })
  @IsEnum(MemberRoleValues)
  @IsOptional()
  role?: MemberRole;
}