import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConflictException, NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => {
  const memberQuery = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  return { memberQuery };
});

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    member: mocks.memberQuery,
  },
}));

import { MembersService } from '../../src/members/members.service.js';

describe('MembersService', () => {
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';
  const memberId = '550e8400-e29b-41d4-a716-446655440001';

  const organizationService = {
    findOne: vi.fn(),
  };

  let service: MembersService;

  beforeEach(() => {
    vi.resetAllMocks();

    organizationService.findOne.mockResolvedValue({
      id: organizationId,
    });

    service = new MembersService(organizationService as never);
  });

  it('creates a HUMAN member', async () => {
    const member = {
      id: memberId,
      organizationId,
      name: 'Anas Ahmed',
      email: 'anas@example.com',
      type: 'HUMAN',
      role: 'DEVELOPER',
      status: 'ACTIVE',
    };

    mocks.memberQuery.findFirst.mockResolvedValue(null);
    mocks.memberQuery.create.mockResolvedValue(member);

    const result = await service.create(organizationId, {
      name: 'Anas Ahmed',
      email: 'ANAS@example.com',
      type: 'HUMAN',
      role: 'DEVELOPER',
    });

    expect(mocks.memberQuery.create).toHaveBeenCalledWith({
      data: {
        organizationId,
        name: 'Anas Ahmed',
        email: 'anas@example.com',
        type: 'HUMAN',
        role: 'DEVELOPER',
      },
    });

    expect(result).toEqual(member);
  });

  it('creates an AI member', async () => {
    const member = {
      id: memberId,
      organizationId,
      name: 'AI Agent',
      email: 'ai@example.com',
      type: 'AI',
      role: 'AI_DEVELOPER',
      status: 'ACTIVE',
    };

    mocks.memberQuery.findFirst.mockResolvedValue(null);
    mocks.memberQuery.create.mockResolvedValue(member);

    const result = await service.create(organizationId, {
      name: 'AI Agent',
      email: 'ai@example.com',
      type: 'AI',
      role: 'AI_DEVELOPER',
    });

    expect(mocks.memberQuery.create).toHaveBeenCalledWith({
      data: {
        organizationId,
        name: 'AI Agent',
        email: 'ai@example.com',
        type: 'AI',
        role: 'AI_DEVELOPER',
      },
    });

    expect(result).toEqual(member);
  });

  it('rejects create when organization does not exist', async () => {
    organizationService.findOne.mockRejectedValue(
      new NotFoundException({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      }),
    );

    await expect(
      service.create(organizationId, {
        name: 'Anas Ahmed',
        email: 'anas@example.com',
        type: 'HUMAN',
        role: 'DEVELOPER',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mocks.memberQuery.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate email in the same organization', async () => {
    mocks.memberQuery.findFirst.mockResolvedValue({
      id: memberId,
      organizationId,
      email: 'anas@example.com',
    });

    await expect(
      service.create(organizationId, {
        name: 'Anas Ahmed',
        email: 'anas@example.com',
        type: 'HUMAN',
        role: 'DEVELOPER',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(mocks.memberQuery.create).not.toHaveBeenCalled();
  });

  it('throws MEMBER_NOT_FOUND when member does not exist', async () => {
    mocks.memberQuery.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne(organizationId, memberId),
    ).rejects.toMatchObject({
      response: {
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found',
      },
    });
  });

  it('lists members with filters', async () => {
    const members = [
      {
        id: memberId,
        organizationId,
        name: 'Anas Ahmed',
        email: 'anas@example.com',
        type: 'HUMAN',
        role: 'DEVELOPER',
        status: 'ACTIVE',
      },
    ];

    mocks.memberQuery.findMany.mockResolvedValue(members);

    const result = await service.findAll(organizationId, {
      type: 'HUMAN',
      status: 'ACTIVE',
    });

    expect(mocks.memberQuery.findMany).toHaveBeenCalledWith({
      where: { organizationId, type: 'HUMAN', status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(members);
  });

  it('updates a member', async () => {
    mocks.memberQuery.findFirst.mockResolvedValue({
      id: memberId,
      organizationId,
      name: 'Anas Ahmed',
      email: 'anas@example.com',
      type: 'HUMAN',
      role: 'DEVELOPER',
      status: 'ACTIVE',
    });

    mocks.memberQuery.update.mockResolvedValue({
      id: memberId,
      organizationId,
      name: 'Anas Updated',
      email: 'anas@example.com',
      type: 'HUMAN',
      role: 'TEAM_LEAD',
      status: 'ACTIVE',
    });

    const result = await service.update(organizationId, memberId, {
      name: 'Anas Updated',
      role: 'TEAM_LEAD',
    });

    expect(mocks.memberQuery.update).toHaveBeenCalledWith({
      where: { id: memberId, organizationId },
      data: {
        name: 'Anas Updated',
        role: 'TEAM_LEAD',
      },
    });

    expect(result).toMatchObject({
      name: 'Anas Updated',
      role: 'TEAM_LEAD',
    });
  });

  it('deactivates a member using INACTIVE status', async () => {
    mocks.memberQuery.findFirst.mockResolvedValue({
      id: memberId,
      organizationId,
      name: 'Anas Ahmed',
      email: 'anas@example.com',
      type: 'HUMAN',
      role: 'DEVELOPER',
      status: 'ACTIVE',
    });

    mocks.memberQuery.update.mockResolvedValue({});

    const result = await service.remove(organizationId, memberId);

    expect(mocks.memberQuery.update).toHaveBeenCalledWith({
      where: { id: memberId, organizationId },
      data: {
        status: 'INACTIVE',
      },
    });

    expect(result).toEqual({
      id: memberId,
      status: 'INACTIVE',
    });
  });
});
