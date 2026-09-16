import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';

import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { OrganizationService } from './organization.service.js';
import { workspaceNotFound } from './errors/organization-workspace.errors.js';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly organizationService: OrganizationService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateWorkspaceDto,
  ) {
    await this.organizationService.findOne(organizationId);

    return db.orm.public.Workspace.create({
      organizationId,
      name: dto.name,
      description: dto.description ?? null,
    });
  }

  async findByOrganization(
    organizationId: string,
  ) {
    await this.organizationService.findOne(organizationId);

    return db.orm.public.Workspace
      .where({ organizationId })
      .where((workspace) => workspace.archivedAt.isNull())
      .orderBy((workspace) => workspace.createdAt.desc())
      .all();
  }

  async findOne(
    organizationId: string,
    id: string,
  ) {
    await this.organizationService.findOne(organizationId);

    const workspace = await db.orm.public.Workspace
      .where({ id })
      .where({ organizationId })
      .where((workspace) => workspace.archivedAt.isNull())
      .first();

    if (!workspace) {
      throw workspaceNotFound();
    }

    return workspace;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateWorkspaceDto,
  ) {
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

    return db.orm.public.Workspace
      .where({ id })
      .where({ organizationId })
      .update(data);
  }

  async remove(
    organizationId: string,
    id: string,
  ) {
    await this.findOne(organizationId, id);

    await db.orm.public.Workspace
      .where({ id })
      .where({ organizationId })
      .update({
        archivedAt: new Date(),
      });

    return {
      id,
      archived: true,
    };
  }
}