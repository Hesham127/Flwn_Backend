import { Module } from '@nestjs/common';
import { TeamMembersController } from './team-members.controller.js';
import { TeamMembersService } from './team-members.service.js';
import { OrganizationModule } from '../organization/organization.module.js';
import { MembersModule } from '../members/members.module.js';
import { TeamsModule } from '../teams/teams.module.js';

@Module({
  imports: [
    OrganizationModule, // provides OrganizationWorkspaceLookupService
    MembersModule,       // provides MembersService
    TeamsModule,         // provides TeamsService
  ],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
  exports: [TeamMembersService],
})
export class TeamMembersModule {}