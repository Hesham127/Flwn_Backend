import { ConflictException, NotFoundException } from '@nestjs/common';

export const TEAM_MEMBER_ERROR_CODES = {
  TEAM_MEMBER_NOT_FOUND: 'TEAM_MEMBER_NOT_FOUND',
  MEMBER_ALREADY_IN_TEAM: 'MEMBER_ALREADY_IN_TEAM',
  MEMBER_NOT_IN_TEAM: 'MEMBER_NOT_IN_TEAM',
} as const;

export function teamMemberNotFound() {
  return new NotFoundException({
    code: TEAM_MEMBER_ERROR_CODES.TEAM_MEMBER_NOT_FOUND,
    message: 'Team member relationship not found',
  });
}

export function memberAlreadyInTeam(memberId: string, teamId: string) {
  return new ConflictException({
    code: TEAM_MEMBER_ERROR_CODES.MEMBER_ALREADY_IN_TEAM,
    message: `Member "${memberId}" is already in team "${teamId}"`,
  });
}

export function memberNotInTeam(memberId: string, teamId: string) {
  return new NotFoundException({
    code: TEAM_MEMBER_ERROR_CODES.MEMBER_NOT_IN_TEAM,
    message: `Member "${memberId}" is not in team "${teamId}"`,
  });
}