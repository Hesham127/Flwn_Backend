import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => {
  const teamQuery = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { teamQuery };
});

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    team: mocks.teamQuery,
  },
}));

import { TeamsService } from '../../src/teams/teams.service.js';

describe('TeamsService', () => {
  const orgId = 'org-uuid';
  const workspaceId = 'ws-uuid';
  const teamId = 'team-uuid';

  let service: TeamsService;
  const workspaceService = {
    findOne: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = new TeamsService(
      workspaceService as never,
      { findOne: vi.fn() } as never,
    );
  });

  describe('create', () => {
    it('creates a team', async () => {
      workspaceService.findOne.mockResolvedValue(undefined);
      const dto = { name: 'Backend Team', description: 'API' };
      const expected = { id: teamId, workspaceId, ...dto };
      mocks.teamQuery.create.mockResolvedValue(expected);

      const result = await service.create(orgId, workspaceId, dto);
      expect(workspaceService.findOne).toHaveBeenCalledWith(orgId, workspaceId);
      expect(mocks.teamQuery.create).toHaveBeenCalledWith({
        data: { workspaceId, name: dto.name, description: dto.description },
      });
      expect(result).toEqual(expected);
    });

    it('throws if workspace validation fails', async () => {
      workspaceService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.create(orgId, workspaceId, { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('lists all teams in a workspace', async () => {
      workspaceService.findOne.mockResolvedValue(undefined);
      const teams = [{ id: '1', name: 'Team A' }];
      mocks.teamQuery.findMany.mockResolvedValue(teams);

      const result = await service.findAll(orgId, workspaceId, {});
      expect(mocks.teamQuery.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(teams);
    });

    it('filters by search term', async () => {
      workspaceService.findOne.mockResolvedValue(undefined);
      const teams = [
        { id: '1', name: 'Alpha Team', description: 'Frontend' },
        { id: '2', name: 'Beta Team', description: 'Backend' },
      ];
      mocks.teamQuery.findMany.mockResolvedValue([teams[0]]);
      const result = await service.findAll(orgId, workspaceId, {
        search: 'Alpha',
      });
      expect(mocks.teamQuery.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId,
          OR: [
            { name: { contains: 'Alpha', mode: 'insensitive' } },
            { description: { contains: 'Alpha', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Team');
    });
  });

  describe('findOne', () => {
    it('returns a team by ID', async () => {
      workspaceService.findOne.mockResolvedValue(undefined);
      const team = { id: teamId, workspaceId, name: 'Team' };
      mocks.teamQuery.findFirst.mockResolvedValue(team);

      const result = await service.findOne(orgId, workspaceId, teamId);
      expect(result).toEqual(team);
    });

    it('throws TEAM_NOT_FOUND if team not found', async () => {
      workspaceService.findOne.mockResolvedValue(undefined);
      mocks.teamQuery.findFirst.mockResolvedValue(null);
      await expect(service.findOne(orgId, workspaceId, teamId)).rejects.toThrow(
        /Team not found/,
      );
    });
  });

  describe('update', () => {
    it('updates a team', async () => {
      workspaceService.findOne.mockResolvedValue(undefined);
      const existing = { id: teamId, workspaceId, name: 'Old' };
      mocks.teamQuery.findFirst.mockResolvedValue(existing);
      const updated = { ...existing, name: 'New' };
      mocks.teamQuery.update.mockResolvedValue(updated);

      const result = await service.update(orgId, workspaceId, teamId, {
        name: 'New',
      });
      expect(mocks.teamQuery.update).toHaveBeenCalledWith({
        where: { id: teamId, workspaceId },
        data: { name: 'New' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('hard deletes a team', async () => {
      workspaceService.findOne.mockResolvedValue(undefined);
      const existing = { id: teamId, workspaceId, name: 'Team' };
      mocks.teamQuery.findFirst.mockResolvedValue(existing);
      mocks.teamQuery.delete.mockResolvedValue({});

      await service.remove(orgId, workspaceId, teamId);
      expect(mocks.teamQuery.delete).toHaveBeenCalledWith({
        where: { id: teamId, workspaceId },
      });
    });

    it('throws if team not found', async () => {
      workspaceService.findOne.mockResolvedValue(undefined);
      mocks.teamQuery.findFirst.mockResolvedValue(null);
      await expect(service.remove(orgId, workspaceId, teamId)).rejects.toThrow(
        /Team not found/,
      );
    });
  });
});
