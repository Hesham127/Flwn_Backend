import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';

import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { organizationNotFound } from './errors/organization-workspace.errors.js';

@Injectable()
export class OrganizationService {
  async create(dto: CreateOrganizationDto) {
    return db.orm.public.Organization.create({
      name: dto.name,
      description: dto.description ?? null,
    });
  }

  async findAll() {
    return db.orm.public.Organization
      .where((organization) => organization.archivedAt.isNull())
      .orderBy((organization) => organization.createdAt.desc())
      .all();
  }

  async findOne(id: string) {
    const organization = await db.orm.public.Organization
      .where({ id })
      .where((organization) => organization.archivedAt.isNull())
      .first();

    if (!organization) {
      throw organizationNotFound();
    }

    return organization;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ) {
    await this.findOne(id);

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

    return db.orm.public.Organization
      .where({ id })
      .update(data);
  }

  async remove(id: string) {
    await this.findOne(id);

    await db.orm.public.Organization
      .where({ id })
      .update({
        archivedAt: new Date(),
      });

    return {
      id,
      archived: true,
    };
  }
}