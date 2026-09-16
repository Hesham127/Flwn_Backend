import { Module } from '@nestjs/common';
import { MembersController } from './members.controller.js';
import { MembersService } from './members.service.js';
import { OrganizationModule } from '../organization/organization.module.js'; 

@Module({
  imports: [OrganizationModule], // We need OrganizationService
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService], // Export for SP1-ORG-08 (Team members)
})
export class MembersModule {}