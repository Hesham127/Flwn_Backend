import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

const mocks = vi.hoisted(() => {
  const organizationQuery = {
    where: vi.fn(),
    first: vi.fn(),
  };

  const workspaceQuery = {
    where: vi.fn(),
    first: vi.fn(),
  };

  return {
    organizationQuery,
    workspaceQuery,
  };
});

vi.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Organization: mocks.organizationQuery,
        Workspace: mocks.workspaceQuery,
      },
    },
  },
}));

import { OrganizationService } from './organization.service.js';
import { WorkspaceService } from './workspace.service.js';
import { OrganizationWorkspaceLookupService } from './organization-workspace-lookup.service.js';

describe('Organization -> Workspace integration', () => {
  const organizationId =
    '550e8400-e29b-41d4-a716-446655440000';

  const workspaceId =
    '550e8400-e29b-41d4-a716-446655440001';

  let lookupService: OrganizationWorkspaceLookupService;

  beforeEach(async () => {
    vi.clearAllMocks();

    mocks.organizationQuery.where.mockReturnValue(
      mocks.organizationQuery,
    );

    mocks.workspaceQuery.where.mockReturnValue(
      mocks.workspaceQuery,
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizationService,
        WorkspaceService,
        OrganizationWorkspaceLookupService,
      ],
    }).compile();

    lookupService = moduleRef.get(
      OrganizationWorkspaceLookupService,
    );
  });

  it('looks up workspace inside its organization', async () => {
    mocks.organizationQuery.first.mockResolvedValue({
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

    mocks.workspaceQuery.first.mockResolvedValue(
      workspace,
    );

    const result =
      await lookupService.assertWorkspaceInOrganization(
        organizationId,
        workspaceId,
      );

    expect(result).toEqual(workspace);

    expect(
      mocks.workspaceQuery.where,
    ).toHaveBeenCalledWith({
      organizationId,
    });
  });

  it('rejects cross-organization workspace lookup', async () => {
    mocks.organizationQuery.first.mockResolvedValue({
      id: organizationId,
      name: 'Flwn',
      description: null,
      archivedAt: null,
    });

    mocks.workspaceQuery.first.mockResolvedValue(null);

    await expect(
      lookupService.assertWorkspaceInOrganization(
        organizationId,
        workspaceId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});