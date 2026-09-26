import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { MembersService } from '../members/members.service.js';
import { WorkspaceService } from '../workspace/workspace.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';
import { TeamQueryDto } from './dto/team-query.dto.js';
import { teamNotFound } from './errors/team.errors.js';
import {
  memberAlreadyInTeam,
  memberNotInTeam,
} from './errors/team-member.errors.js';

@Injectable()
export class TeamsService {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly membersService: MembersService,
  ) {}

  async create(orgId: string, workspaceId: string, dto: CreateTeamDto) {
    await this.workspaceService.findOne(orgId, workspaceId);
    return db.team.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description ?? null,
      },
    });
  }

  async findAll(orgId: string, workspaceId: string, query: TeamQueryDto) {
    await this.workspaceService.findOne(orgId, workspaceId);
    return db.team.findMany({
      where: {
        workspaceId,
        ...(query.search
          ? {
              OR: [
                {
                  name: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  description: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, workspaceId: string, teamId: string) {
    await this.workspaceService.findOne(orgId, workspaceId);
    const team = await db.team.findFirst({
      where: { id: teamId, workspaceId },
    });
    if (!team) throw teamNotFound();
    return team;
  }

  async update(
    orgId: string,
    workspaceId: string,
    teamId: string,
    dto: UpdateTeamDto,
  ) {
    await this.findOne(orgId, workspaceId, teamId);
    return db.team.update({
      where: { id: teamId, workspaceId },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(orgId: string, workspaceId: string, teamId: string) {
    await this.findOne(orgId, workspaceId, teamId);
    await db.team.delete({ where: { id: teamId, workspaceId } });
  }

  async findMembers(orgId: string, workspaceId: string, teamId: string) {
    await this.findOne(orgId, workspaceId, teamId);
    return db.member.findMany({
      where: {
        organizationId: orgId,
        teams: { some: { id: teamId, workspaceId } },
      },
    });
  }

  async addMember(
    orgId: string,
    workspaceId: string,
    teamId: string,
    memberId: string,
  ) {
    await this.findOne(orgId, workspaceId, teamId);
    await this.membersService.findOne(orgId, memberId);
    const existing = await db.team.findFirst({
      where: { id: teamId, workspaceId, members: { some: { id: memberId } } },
      select: { id: true },
    });
    if (existing) throw memberAlreadyInTeam(memberId, teamId);
    return db.team.update({
      where: { id: teamId, workspaceId },
      data: { members: { connect: { id: memberId, organizationId: orgId } } },
    });
  }

  async removeMember(
    orgId: string,
    workspaceId: string,
    teamId: string,
    memberId: string,
  ) {
    await this.findOne(orgId, workspaceId, teamId);
    await this.membersService.findOne(orgId, memberId);
    const existing = await db.team.findFirst({
      where: { id: teamId, workspaceId, members: { some: { id: memberId } } },
      select: { id: true },
    });
    if (!existing) throw memberNotInTeam(memberId, teamId);
    await db.team.update({
      where: { id: teamId, workspaceId },
      data: { members: { disconnect: { id: memberId } } },
    });
  }

  async findMemberTeams(orgId: string, memberId: string) {
    await this.membersService.findOne(orgId, memberId);
    return db.team.findMany({
      where: {
        workspace: { organizationId: orgId },
        members: { some: { id: memberId } },
      },
    });
  }
}
