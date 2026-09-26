import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export const MEMBER_ERROR_CODES = {
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  MEMBER_ALREADY_EXISTS: 'MEMBER_ALREADY_EXISTS',
} as const;

export function memberNotFound() {
  return new NotFoundException({
    code: MEMBER_ERROR_CODES.MEMBER_NOT_FOUND,
    message: 'Member not found',
  });
}

export function memberAlreadyExists(email: string) {
  return new ConflictException({
    code: MEMBER_ERROR_CODES.MEMBER_ALREADY_EXISTS,
    message: `Member with email "${email}" already exists in this organization.`,
  });
}