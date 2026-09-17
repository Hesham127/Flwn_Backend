import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';
import { TeamMembersController } from './team-members.controller.js';
import { TeamMembersService } from './team-members.service.js';
import { OrganizationModule } from '../organization/organization.module.js';
import { MembersModule } from '../members/members.module.js';

@Module({
  imports: [OrganizationModule, MembersModule],
  controllers: [TeamsController, TeamMembersController],
  providers: [TeamsService, TeamMembersService],
  exports: [TeamsService, TeamMembersService],
})
export class TeamsModule {}