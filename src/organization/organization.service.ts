import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';

import { db } from '../prisma/db.js';

import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';

@Injectable()
export class OrganizationService {
  async create(dto: CreateOrganizationDto) {
    return db.organization.create({
      data: { name: dto.name, description: dto.description ?? null },
    });
  }

  async findAll() {
    return db.organization.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const organization = await db.organization.findFirst({
      where: { id, archivedAt: null },
    });

    if (!organization) {
      throw new NotFoundException({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      });
    }

    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
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

    return db.organization.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);

    await db.organization.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    return {
      id,
      archived: true,
    };
  }
}
