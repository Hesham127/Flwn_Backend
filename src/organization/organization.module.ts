import { Module } from '@nestjs/common';
import { OrganizationMembershipService } from './organization-membership.service.js';

import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';

@Module({
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    OrganizationMembershipService,
    {
      provide: 'ORGANIZATION_MEMBERSHIP',
      useExisting: OrganizationMembershipService,
    },
  ],
  exports: [OrganizationService, 'ORGANIZATION_MEMBERSHIP'],
})
export class OrganizationModule {}
