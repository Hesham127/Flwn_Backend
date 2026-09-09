import { Module } from '@nestjs/common';
import { OrganizationMembershipService } from './organization-membership.service.js';

@Module({
	providers: [
		OrganizationMembershipService,
		{
			provide: 'ORGANIZATION_MEMBERSHIP',
			useExisting: OrganizationMembershipService,
		},
	],
	exports: ['ORGANIZATION_MEMBERSHIP'],
})
export class OrganizationModule {}
