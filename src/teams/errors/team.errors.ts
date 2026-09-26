import { NotFoundException } from '@nestjs/common';

export const TEAM_ERROR_CODES = {
  TEAM_NOT_FOUND: 'TEAM_NOT_FOUND',
} as const;

export function teamNotFound() {
  return new NotFoundException({
    code: TEAM_ERROR_CODES.TEAM_NOT_FOUND,
    message: 'Team not found',
  });
}