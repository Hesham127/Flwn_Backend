import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

const mocks = vi.hoisted(() => {
  const organizationQuery = {
    findFirst: vi.fn(),
  };

  const workspaceQuery = {
    findFirst: vi.fn(),
  };

  return {
    organizationQuery,
    workspaceQuery,
  };
});

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    organization: mocks.organizationQuery,
    workspace: mocks.workspaceQuery,
  },
}));

import { OrganizationWorkspaceLookupModule } from '../../src/organization-workspace-lookup/organization-workspace-lookup.module.js';
import { OrganizationWorkspaceLookupService } from '../../src/organization-workspace-lookup/organization-workspace-lookup.service.js';

describe('Organization -> Workspace integration', () => {
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';

  const workspaceId = '550e8400-e29b-41d4-a716-446655440001';

  let lookupService: OrganizationWorkspaceLookupService;

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [OrganizationWorkspaceLookupModule],
    }).compile();

    lookupService = moduleRef.get(OrganizationWorkspaceLookupService);
  });

  it('looks up workspace inside its organization', async () => {
    mocks.organizationQuery.findFirst.mockResolvedValue({
      id: organizationId,
      name: 'Flwn',
      description: null,
      archivedAt: null,
    });

    const workspace = {
      id: workspaceId,
      organizationId,
      name: 'Engineering',
      description: null,
      archivedAt: null,
    };

    mocks.workspaceQuery.findFirst.mockResolvedValue(workspace);

    const result = await lookupService.assertWorkspaceInOrganization(
      organizationId,
      workspaceId,
    );

    expect(result).toEqual(workspace);

    expect(mocks.workspaceQuery.findFirst).toHaveBeenCalledWith({
      where: { id: workspaceId, organizationId, archivedAt: null },
    });
  });

  it('rejects cross-organization workspace lookup', async () => {
    mocks.organizationQuery.findFirst.mockResolvedValue({
      id: organizationId,
      name: 'Flwn',
      description: null,
      archivedAt: null,
    });

    mocks.workspaceQuery.findFirst.mockResolvedValue(null);

    await expect(
      lookupService.assertWorkspaceInOrganization(organizationId, workspaceId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects lookup under a missing or archived organization before querying workspaces', async () => {
    mocks.organizationQuery.findFirst.mockResolvedValue(null);
    await expect(
      lookupService.getWorkspace(organizationId, workspaceId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.organizationQuery.findFirst).toHaveBeenCalledWith({
      where: { id: organizationId, archivedAt: null },
    });
    expect(mocks.workspaceQuery.findFirst).not.toHaveBeenCalled();
  });
});
