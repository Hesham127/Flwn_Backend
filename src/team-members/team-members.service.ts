import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { MembersService } from '../members/members.service.js';
import { TeamsService } from '../teams/teams.service.js';
import { OrganizationWorkspaceLookupService } from '../organization/organization-workspace-lookup.service.js';
import {
  memberAlreadyInTeam,
  memberNotInTeam,
  teamMemberNotFound,
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

    const members = await db.orm.public.Member
      .where((member: any) =>
        member.teams.some((team: any) => team.id === teamId)
      )
      .all();

    return members;
  }

  async add(orgId: string, workspaceId: string, teamId: string, memberId: string) {
    await this.validateWorkspace(orgId, workspaceId);
    await this.validateTeam(orgId, workspaceId, teamId);
    await this.validateMember(orgId, memberId);

    // Check if already in team
    const existing = await db.orm.public.TeamMember
      .where({ teamId })
      .where({ memberId })
      .first();

    if (existing) {
      throw memberAlreadyInTeam(memberId, teamId);
    }

    // Add member to team
    return db.orm.public.TeamMember.create({
      teamId,
      memberId,
    });
  }

  async remove(orgId: string, workspaceId: string, teamId: string, memberId: string) {
    await this.validateWorkspace(orgId, workspaceId);
    await this.validateTeam(orgId, workspaceId, teamId);
    await this.validateMember(orgId, memberId);

    const relationship = await db.orm.public.TeamMember
      .where({ teamId })
      .where({ memberId })
      .first();

    if (!relationship) {
      throw memberNotInTeam(memberId, teamId);
    }

    await db.orm.public.TeamMember
      .where({ teamId })
      .where({ memberId })
      .delete();

    // returns void -> 204 No Content
  }

  // EXTRA: List all teams for a member
  async findMemberTeams(orgId: string, memberId: string) {
    await this.validateMember(orgId, memberId);

    const teams = await db.orm.public.Team
      .where((team: any) =>
        team.members.some((member: any) => member.id === memberId)
      )
      .all();

    return teams;
  }
}