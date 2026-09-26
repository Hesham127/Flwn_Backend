import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';
import { MembersModule } from '../members/members.module.js';

@Module({
  imports: [WorkspaceModule, MembersModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
