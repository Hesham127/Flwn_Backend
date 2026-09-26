import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { CreateMemberDto } from './dto/create-member.dto.js';
import { UpdateMemberDto } from './dto/update-member.dto.js';
import { MemberQueryDto } from './dto/member-query.dto.js';
import { OrganizationService } from '../organization/organization.service.js';
import { memberAlreadyExists, memberNotFound } from './errors/member.errors.js';

@Injectable()
export class MembersService {
  constructor(private readonly organizationService: OrganizationService) {}

  private async validateOrganization(orgId: string) {
    await this.organizationService.findOne(orgId);
  }

  async create(orgId: string, dto: CreateMemberDto) {
    await this.validateOrganization(orgId);

    const email = dto.email.toLowerCase();

    const existing = await db.member.findFirst({
      where: { organizationId: orgId, email },
    });

    if (existing) {
      throw memberAlreadyExists(email);
    }

    return db.member.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        email,
        type: dto.type ?? 'HUMAN',
        role: dto.role ?? 'DEVELOPER',
      },
    });
  }

  async findAll(orgId: string, query: MemberQueryDto) {
    await this.validateOrganization(orgId);

    const { type, role, status, search } = query;

    return db.member.findMany({
      where: {
        organizationId: orgId,
        type,
        role,
        status,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, memberId: string) {
    await this.validateOrganization(orgId);

    const member = await db.member.findFirst({
      where: { id: memberId, organizationId: orgId },
    });

    if (!member) {
      throw memberNotFound();
    }

    return member;
  }

  async update(orgId: string, memberId: string, dto: UpdateMemberDto) {
    await this.findOne(orgId, memberId);

    const data: {
      name?: string;
      role?: 'TEAM_LEAD' | 'DEVELOPER' | 'AI_DEVELOPER';
      status?: 'ACTIVE' | 'INACTIVE';
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    return db.member.update({
      where: { id: memberId, organizationId: orgId },
      data,
    });
  }

  async remove(orgId: string, memberId: string) {
    await this.findOne(orgId, memberId);

    await db.member.update({
      where: { id: memberId, organizationId: orgId },
      data: { status: 'INACTIVE' },
    });

    return {
      id: memberId,
      status: 'INACTIVE',
    };
  }
}
