import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => {
  const teamQuery = {
    where: vi.fn(),
    orderBy: vi.fn(),
    all: vi.fn(),
    first: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { teamQuery };
});

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Team: mocks.teamQuery,
      },
    },
  },
}));

import { TeamsService } from '../../src/teams/teams.service.js';
import { OrganizationWorkspaceLookupService } from '../../src/organization/organization-workspace-lookup.service.js';

describe('TeamsService', () => {
  const orgId = 'org-uuid';
  const workspaceId = 'ws-uuid';
  const teamId = 'team-uuid';

  let service: TeamsService;
  const lookupService = {
    assertWorkspaceInOrganization: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.teamQuery.where.mockReturnValue(mocks.teamQuery);
    mocks.teamQuery.orderBy.mockReturnValue(mocks.teamQuery);
    service = new TeamsService(lookupService as never);
  });

  describe('create', () => {
    it('creates a team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      const dto = { name: 'Backend Team', description: 'API' };
      const expected = { id: teamId, workspaceId, ...dto };
      mocks.teamQuery.create.mockResolvedValue(expected);

      const result = await service.create(orgId, workspaceId, dto);
      expect(lookupService.assertWorkspaceInOrganization).toHaveBeenCalledWith(orgId, workspaceId);
      expect(mocks.teamQuery.create).toHaveBeenCalledWith({
        workspaceId,
        name: dto.name,
        description: dto.description,
      });
      expect(result).toEqual(expected);
    });

    it('throws if workspace validation fails', async () => {
      lookupService.assertWorkspaceInOrganization.mockRejectedValue(new NotFoundException());
      await expect(service.create(orgId, workspaceId, { name: 'Test' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('lists all teams in a workspace', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      const teams = [{ id: '1', name: 'Team A' }];
      mocks.teamQuery.all.mockResolvedValue(teams);

      const result = await service.findAll(orgId, workspaceId, {});
      expect(mocks.teamQuery.where).toHaveBeenCalledWith({ workspaceId });
      expect(result).toEqual(teams);
    });

    it('filters by search term', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      const teams = [
        { id: '1', name: 'Alpha Team', description: 'Frontend' },
        { id: '2', name: 'Beta Team', description: 'Backend' },
      ];
      mocks.teamQuery.all.mockResolvedValue(teams);
      const result = await service.findAll(orgId, workspaceId, { search: 'Alpha' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Team');
    });
  });

  describe('findOne', () => {
    it('returns a team by ID', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      const team = { id: teamId, workspaceId, name: 'Team' };
      mocks.teamQuery.first.mockResolvedValue(team);

      const result = await service.findOne(orgId, workspaceId, teamId);
      expect(result).toEqual(team);
    });

    it('throws TEAM_NOT_FOUND if team not found', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      mocks.teamQuery.first.mockResolvedValue(null);
      await expect(service.findOne(orgId, workspaceId, teamId))
        .rejects.toThrow(/Team not found/);
    });
  });

  describe('update', () => {
    it('updates a team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      const existing = { id: teamId, workspaceId, name: 'Old' };
      mocks.teamQuery.first.mockResolvedValue(existing);
      const updated = { ...existing, name: 'New' };
      mocks.teamQuery.update.mockResolvedValue(updated);

      const result = await service.update(orgId, workspaceId, teamId, { name: 'New' });
      expect(mocks.teamQuery.update).toHaveBeenCalledWith({ name: 'New' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('hard deletes a team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      const existing = { id: teamId, workspaceId, name: 'Team' };
      mocks.teamQuery.first.mockResolvedValue(existing);
      mocks.teamQuery.delete.mockResolvedValue({});

      await service.remove(orgId, workspaceId, teamId);
      expect(mocks.teamQuery.delete).toHaveBeenCalled();
    });

    it('throws if team not found', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      mocks.teamQuery.first.mockResolvedValue(null);
      await expect(service.remove(orgId, workspaceId, teamId))
        .rejects.toThrow(/Team not found/);
    });
  });
});