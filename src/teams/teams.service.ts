import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';
import { TeamQueryDto } from './dto/team-query.dto.js';
import { teamNotFound } from './errors/team.errors.js';
import { OrganizationWorkspaceLookupService } from '../organization/organization-workspace-lookup.service.js';

@Injectable()
export class TeamsService {
  constructor(
    private readonly lookupService: OrganizationWorkspaceLookupService,
  ) {}

  private async validateWorkspace(orgId: string, workspaceId: string) {
    await this.lookupService.assertWorkspaceInOrganization(orgId, workspaceId);
  }

  async create(orgId: string, workspaceId: string, dto: CreateTeamDto) {
    await this.validateWorkspace(orgId, workspaceId);

    return db.orm.public.Team.create({
      workspaceId,
      name: dto.name,
      description: dto.description ?? null,
    });
  }

  async findAll(orgId: string, workspaceId: string, query: TeamQueryDto) {
    await this.validateWorkspace(orgId, workspaceId);

    let whereBuilder = db.orm.public.Team.where({ workspaceId });

    const allTeams = await whereBuilder
      .orderBy((team: any) => team.createdAt.desc())
      .all();

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      return allTeams.filter((t: any) =>
        t.name.toLowerCase().includes(searchLower) ||
        (t.description?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return allTeams;
  }

  async findOne(orgId: string, workspaceId: string, teamId: string) {
    await this.validateWorkspace(orgId, workspaceId);

    const team = await db.orm.public.Team
      .where({ id: teamId })
      .where({ workspaceId })
      .first();

    if (!team) {
      throw teamNotFound();
    }

    return team;
  }

  async update(orgId: string, workspaceId: string, teamId: string, dto: UpdateTeamDto) {
    await this.findOne(orgId, workspaceId, teamId);

    const data: { name?: string; description?: string | null } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;

    return db.orm.public.Team
      .where({ id: teamId })
      .where({ workspaceId })
      .update(data);
  }

  async remove(orgId: string, workspaceId: string, teamId: string) {
    await this.findOne(orgId, workspaceId, teamId);

    await db.orm.public.Team
      .where({ id: teamId })
      .where({ workspaceId })
      .delete();

    // returns void -> 204 No Content
  }
}