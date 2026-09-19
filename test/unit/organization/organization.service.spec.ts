import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => {
  const organizationQuery = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  return {
    organizationQuery,
  };
});

vi.mock('../../../src/prisma/db.js', () => ({
  db: {
    organization: mocks.organizationQuery,
  },
}));

import { OrganizationService } from '../../../src/organization/organization.service.js';

describe('OrganizationService', () => {
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';

  let service: OrganizationService;

  beforeEach(() => {
    vi.resetAllMocks();

    service = new OrganizationService();
  });

  it('creates an organization', async () => {
    const organization = {
      id: organizationId,
      name: 'Flwn',
      description: null,
      archivedAt: null,
    };

    mocks.organizationQuery.create.mockResolvedValue(organization);

    const result = await service.create({
      name: 'Flwn',
    });

    expect(mocks.organizationQuery.create).toHaveBeenCalledWith({
      data: { name: 'Flwn', description: null },
    });

    expect(result).toEqual(organization);
  });

  it('throws ORGANIZATION_NOT_FOUND when organization does not exist', async () => {
    mocks.organizationQuery.findFirst.mockResolvedValue(null);

    await expect(service.findOne(organizationId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('soft deletes organization using archivedAt', async () => {
    mocks.organizationQuery.findFirst.mockResolvedValue({
      id: organizationId,
      name: 'Flwn',
      description: null,
      archivedAt: null,
    });

    mocks.organizationQuery.update.mockResolvedValue({});

    const result = await service.remove(organizationId);

    expect(mocks.organizationQuery.update).toHaveBeenCalledWith({
      where: { id: organizationId },
      data: { archivedAt: expect.any(Date) },
    });

    expect(result).toEqual({
      id: organizationId,
      archived: true,
    });
  });

  it('lists only active organizations, newest first', async () => {
    mocks.organizationQuery.findMany.mockResolvedValue([]);
    expect(await service.findAll()).toEqual([]);
    expect(mocks.organizationQuery.findMany).toHaveBeenCalledWith({
      where: { archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it.each([{ name: 'Renamed' }, { description: null }])(
    'updates only supplied fields: %j',
    async (data) => {
      mocks.organizationQuery.findFirst.mockResolvedValue({
        id: organizationId,
      });
      await service.update(organizationId, data);
      expect(mocks.organizationQuery.findFirst).toHaveBeenCalledWith({
        where: { id: organizationId, archivedAt: null },
      });
      expect(mocks.organizationQuery.update).toHaveBeenCalledWith({
        where: { id: organizationId },
        data,
      });
    },
  );
});
