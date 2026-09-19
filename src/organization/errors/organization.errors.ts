import { NotFoundException } from '@nestjs/common';

export function organizationNotFound() {
  return new NotFoundException({
    code: 'ORGANIZATION_NOT_FOUND',
    message: 'Organization not found',
  });
}
