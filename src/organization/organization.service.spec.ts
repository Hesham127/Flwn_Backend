import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => {
  const organizationQuery = {
    where: vi.fn(),
    orderBy: vi.fn(),
    all: vi.fn(),
    first: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  return {
    organizationQuery,
  };
});

vi.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Organization: mocks.organizationQuery,
      },
    },
  },
}));

import { OrganizationService } from './organization.service.js';

describe('OrganizationService', () => {
  const organizationId =
    '550e8400-e29b-41d4-a716-446655440000';

  let service: OrganizationService;

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.organizationQuery.where.mockReturnValue(
      mocks.organizationQuery,
    );

    mocks.organizationQuery.orderBy.mockReturnValue(
      mocks.organizationQuery,
    );

    service = new OrganizationService();
  });

  it('creates an organization', async () => {
    const organization = {
      id: organizationId,
      name: 'Flwn',
      description: null,
      archivedAt: null,
    };

    mocks.organizationQuery.create.mockResolvedValue(
      organization,
    );

    const result = await service.create({
      name: 'Flwn',
    });

    expect(
      mocks.organizationQuery.create,
    ).toHaveBeenCalledWith({
      name: 'Flwn',
      description: null,
    });

    expect(result).toEqual(organization);
  });

  it('throws ORGANIZATION_NOT_FOUND when organization does not exist', async () => {
    mocks.organizationQuery.first.mockResolvedValue(null);

    await expect(
      service.findOne(organizationId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft deletes organization using archivedAt', async () => {
    mocks.organizationQuery.first.mockResolvedValue({
      id: organizationId,
      name: 'Flwn',
      description: null,
      archivedAt: null,
    });

    mocks.organizationQuery.update.mockResolvedValue({});

    const result = await service.remove(
      organizationId,
    );

    expect(
      mocks.organizationQuery.update,
    ).toHaveBeenCalledWith({
      archivedAt: expect.any(Date),
    });

    expect(result).toEqual({
      id: organizationId,
      archived: true,
    });
  });
});