import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { MembersService } from '../members/members.service.js';
import { TeamsService } from './teams.service.js';
import { OrganizationWorkspaceLookupService } from '../organization/organization-workspace-lookup.service.js';
import {
  memberAlreadyInTeam,
  memberNotInTeam,
} from './errors/team-member.errors.js';

@Injectable()
export class TeamMembersService {
  constructor(
    private readonly membersService: MembersService,
    private readonly teamsService: TeamsService,
    private readonly lookupService: OrganizationWorkspaceLookupService,
  ) {}

  private async validateWorkspace(orgId: string, workspaceId: string) {
    await this.lookupService.assertWorkspaceInOrganization(orgId, workspaceId);
  }

  private async validateTeam(orgId: string, workspaceId: string, teamId: string) {
    await this.teamsService.findOne(orgId, workspaceId, teamId);
  }

  private async validateMember(orgId: string, memberId: string) {
    await this.membersService.findOne(orgId, memberId);
  }

  async findAll(orgId: string, workspaceId: string, teamId: string) {
    await this.validateWorkspace(orgId, workspaceId);
    await this.validateTeam(orgId, workspaceId, teamId);

    const team = await db.orm.public.Team
      .where({ id: teamId })
      .include({ members: true })
      .first();

    return team?.members ?? [];
  }

  async add(orgId: string, workspaceId: string, teamId: string, memberId: string) {
    await this.validateWorkspace(orgId, workspaceId);
    await this.validateTeam(orgId, workspaceId, teamId);
    await this.validateMember(orgId, memberId);

    const team = await db.orm.public.Team
      .where({ id: teamId })
      .include({ members: { where: { id: memberId } } })
      .first();

    if (team?.members && team.members.length > 0) {
      throw memberAlreadyInTeam(memberId, teamId);
    }

    return db.orm.public.Team
      .where({ id: teamId })
      .update({
        members: {
          connect: { id: memberId },
        },
      });
  }

  async remove(orgId: string, workspaceId: string, teamId: string, memberId: string) {
    await this.validateWorkspace(orgId, workspaceId);
    await this.validateTeam(orgId, workspaceId, teamId);
    await this.validateMember(orgId, memberId);

    const team = await db.orm.public.Team
      .where({ id: teamId })
      .include({ members: { where: { id: memberId } } })
      .first();

    if (!team?.members || team.members.length === 0) {
      throw memberNotInTeam(memberId, teamId);
    }

    return db.orm.public.Team
      .where({ id: teamId })
      .update({
        members: {
          disconnect: { id: memberId },
        },
      });
  }

  async findMemberTeams(orgId: string, memberId: string) {
    await this.validateMember(orgId, memberId);

    const member = await db.orm.public.Member
      .where({ id: memberId })
      .include({ teams: true })
      .first();

    return member?.teams ?? [];
  }
}