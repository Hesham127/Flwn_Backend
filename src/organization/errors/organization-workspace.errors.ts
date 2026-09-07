import { NotFoundException } from '@nestjs/common';

export const ORGANIZATION_WORKSPACE_ERROR_CODES = {
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  WORKSPACE_NOT_FOUND: 'WORKSPACE_NOT_FOUND',
} as const;

export function organizationNotFound() {
  return new NotFoundException({
    code: ORGANIZATION_WORKSPACE_ERROR_CODES.ORGANIZATION_NOT_FOUND,
    message: 'Organization not found',
  });
}

export function workspaceNotFound() {
  return new NotFoundException({
    code: ORGANIZATION_WORKSPACE_ERROR_CODES.WORKSPACE_NOT_FOUND,
    message: 'Workspace not found',
  });
}