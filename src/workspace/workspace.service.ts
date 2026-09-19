import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';

import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { OrganizationService } from '../organization/organization.service.js';
import { workspaceNotFound } from './errors/workspace.errors.js';

@Injectable()
export class WorkspaceService {
  constructor(private readonly organizationService: OrganizationService) {}

  async create(organizationId: string, dto: CreateWorkspaceDto) {
    await this.organizationService.findOne(organizationId);

    return db.workspace.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? null,
      },
    });
  }

  async findByOrganization(organizationId: string) {
    await this.organizationService.findOne(organizationId);

    return db.workspace.findMany({
      where: { organizationId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    await this.organizationService.findOne(organizationId);

    const workspace = await db.workspace.findFirst({
      where: { id, organizationId, archivedAt: null },
    });

    if (!workspace) {
      throw workspaceNotFound();
    }

    return workspace;
  }

  async update(organizationId: string, id: string, dto: UpdateWorkspaceDto) {
    await this.findOne(organizationId, id);

    const data: {
      name?: string;
      description?: string | null;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    return db.workspace.update({ where: { id, organizationId }, data });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    await db.workspace.update({
      where: { id, organizationId },
      data: { archivedAt: new Date() },
    });

    return {
      id,
      archived: true,
    };
  }
}
