import { NotFoundException } from '@nestjs/common';

export function workspaceNotFound() {
  return new NotFoundException({
    code: 'WORKSPACE_NOT_FOUND',
    message: 'Workspace not found',
  });
}
