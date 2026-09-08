import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';
import { OrganizationModule } from '../organization/organization.module.js';

@Module({
  imports: [OrganizationModule], // provides OrganizationWorkspaceLookupService
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}