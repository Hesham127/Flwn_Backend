import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => {
  const workspaceQuery = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  return {
    workspaceQuery,
  };
});

vi.mock('../../../src/prisma/db.js', () => ({
  db: {
    workspace: mocks.workspaceQuery,
  },
}));

import { WorkspaceService } from '../../../src/workspace/workspace.service.js';

describe('WorkspaceService', () => {
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';

  const workspaceId = '550e8400-e29b-41d4-a716-446655440001';

  const organizationService = {
    findOne: vi.fn(),
  };

  let service: WorkspaceService;

  beforeEach(() => {
    vi.resetAllMocks();

    service = new WorkspaceService(organizationService as never);
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

    expect(mocks.workspaceQuery.create).not.toHaveBeenCalled();
  });

  it('soft deletes workspace using archivedAt', async () => {
    organizationService.findOne.mockResolvedValue({
      id: organizationId,
    });

    mocks.workspaceQuery.findFirst.mockResolvedValue({
      id: workspaceId,
      organizationId,
      name: 'Engineering',
      archivedAt: null,
    });

    mocks.workspaceQuery.update.mockResolvedValue({});

    const result = await service.remove(organizationId, workspaceId);

    expect(mocks.workspaceQuery.update).toHaveBeenCalledWith({
      where: { id: workspaceId, organizationId },
      data: { archivedAt: expect.any(Date) },
    });

    expect(result).toEqual({
      id: workspaceId,
      archived: true,
    });
  });

  it('creates a workspace under its validated organization', async () => {
    organizationService.findOne.mockResolvedValue({ id: organizationId });
    await service.create(organizationId, { name: 'Engineering' });
    expect(organizationService.findOne).toHaveBeenCalledWith(organizationId);
    expect(mocks.workspaceQuery.create).toHaveBeenCalledWith({
      data: { organizationId, name: 'Engineering', description: null },
    });
  });

  it('lists only active workspaces within the organization, newest first', async () => {
    organizationService.findOne.mockResolvedValue({ id: organizationId });
    mocks.workspaceQuery.findMany.mockResolvedValue([]);
    expect(await service.findByOrganization(organizationId)).toEqual([]);
    expect(organizationService.findOne).toHaveBeenCalledWith(organizationId);
    expect(mocks.workspaceQuery.findMany).toHaveBeenCalledWith({
      where: { organizationId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it.each([{ name: 'Renamed' }, { description: null }])(
    'updates only supplied fields within the organization: %j',
    async (data) => {
      organizationService.findOne.mockResolvedValue({ id: organizationId });
      mocks.workspaceQuery.findFirst.mockResolvedValue({
        id: workspaceId,
        organizationId,
      });
      await service.update(organizationId, workspaceId, data);
      expect(mocks.workspaceQuery.findFirst).toHaveBeenCalledWith({
        where: { id: workspaceId, organizationId, archivedAt: null },
      });
      expect(mocks.workspaceQuery.update).toHaveBeenCalledWith({
        where: { id: workspaceId, organizationId },
        data,
      });
    },
  );
});
