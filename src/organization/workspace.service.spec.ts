import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => {
  const workspaceQuery = {
    where: vi.fn(),
    orderBy: vi.fn(),
    all: vi.fn(),
    first: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  return {
    workspaceQuery,
  };
});

vi.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Workspace: mocks.workspaceQuery,
      },
    },
  },
}));

import { WorkspaceService } from './workspace.service.js';

describe('WorkspaceService', () => {
  const organizationId =
    '550e8400-e29b-41d4-a716-446655440000';

  const workspaceId =
    '550e8400-e29b-41d4-a716-446655440001';

  const organizationService = {
    findOne: vi.fn(),
  };

  let service: WorkspaceService;

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.workspaceQuery.where.mockReturnValue(
      mocks.workspaceQuery,
    );

    mocks.workspaceQuery.orderBy.mockReturnValue(
      mocks.workspaceQuery,
    );

    service = new WorkspaceService(
      organizationService as never,
    );
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
        name: 'Engineering',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(
      mocks.workspaceQuery.create,
    ).not.toHaveBeenCalled();
  });

  it('soft deletes workspace using archivedAt', async () => {
    organizationService.findOne.mockResolvedValue({
      id: organizationId,
    });

    mocks.workspaceQuery.first.mockResolvedValue({
      id: workspaceId,
      organizationId,
      name: 'Engineering',
      archivedAt: null,
    });

    mocks.workspaceQuery.update.mockResolvedValue({});

    const result = await service.remove(
      organizationId,
      workspaceId,
    );

    expect(
      mocks.workspaceQuery.update,
    ).toHaveBeenCalledWith({
      archivedAt: expect.any(Date),
    });

    expect(result).toEqual({
      id: workspaceId,
      archived: true,
    });
  });
});