import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => {
  const teamQuery = {
    where: vi.fn(),
    include: vi.fn(),
    first: vi.fn(),
    update: vi.fn(),
  };
  const memberQuery = {
    where: vi.fn(),
    include: vi.fn(),
    first: vi.fn(),
  };
  return { teamQuery, memberQuery };
});

vi.mock('../../src/prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Team: mocks.teamQuery,
        Member: mocks.memberQuery,
      },
    },
  },
}));

import { TeamMembersService } from '../../src/teams/team-members.service.js';
import { MembersService } from '../../src/members/members.service.js';
import { TeamsService } from '../../src/teams/teams.service.js';
import { OrganizationWorkspaceLookupService } from '../../src/organization/organization-workspace-lookup.service.js';

describe('TeamMembersService', () => {
  const orgId = 'org-uuid';
  const workspaceId = 'ws-uuid';
  const teamId = 'team-uuid';
  const memberId = 'member-uuid';

  let service: TeamMembersService;
  const lookupService = {
    assertWorkspaceInOrganization: vi.fn(),
  };
  const membersService = {
    findOne: vi.fn(),
  };
  const teamsService = {
    findOne: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.teamQuery.where.mockReturnValue(mocks.teamQuery);
    mocks.teamQuery.include.mockReturnValue(mocks.teamQuery);
    mocks.memberQuery.where.mockReturnValue(mocks.memberQuery);
    mocks.memberQuery.include.mockReturnValue(mocks.memberQuery);

    service = new TeamMembersService(
      membersService as never,
      teamsService as never,
      lookupService as never,
    );
  });

  describe('add', () => {
    it('adds a member to a team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      teamsService.findOne.mockResolvedValue({ id: teamId });
      membersService.findOne.mockResolvedValue({ id: memberId });
      mocks.teamQuery.first.mockResolvedValue({ members: [] });
      mocks.teamQuery.update.mockResolvedValue({ teamId, memberId });

      const result = await service.add(orgId, workspaceId, teamId, memberId);
      expect(result).toEqual({ teamId, memberId });
      expect(mocks.teamQuery.update).toHaveBeenCalledWith({
        members: { connect: { id: memberId } },
      });
    });

    it('throws if member already in team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      teamsService.findOne.mockResolvedValue({ id: teamId });
      membersService.findOne.mockResolvedValue({ id: memberId });
      mocks.teamQuery.first.mockResolvedValue({ members: [{ id: memberId }] });

      await expect(service.add(orgId, workspaceId, teamId, memberId))
        .rejects.toThrow(ConflictException);
    });

    it('throws if team not found', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      teamsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.add(orgId, workspaceId, teamId, memberId))
        .rejects.toThrow(NotFoundException);
    });

    it('throws if member not found', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      teamsService.findOne.mockResolvedValue({ id: teamId });
      membersService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.add(orgId, workspaceId, teamId, memberId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes a member from a team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      teamsService.findOne.mockResolvedValue({ id: teamId });
      membersService.findOne.mockResolvedValue({ id: memberId });
      mocks.teamQuery.first.mockResolvedValue({ members: [{ id: memberId }] });
      mocks.teamQuery.update.mockResolvedValue({});

      await service.remove(orgId, workspaceId, teamId, memberId);
      expect(mocks.teamQuery.update).toHaveBeenCalledWith({
        members: { disconnect: { id: memberId } },
      });
    });

    it('throws if member not in team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      teamsService.findOne.mockResolvedValue({ id: teamId });
      membersService.findOne.mockResolvedValue({ id: memberId });
      mocks.teamQuery.first.mockResolvedValue({ members: [] });

      await expect(service.remove(orgId, workspaceId, teamId, memberId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('lists all members in a team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      teamsService.findOne.mockResolvedValue({ id: teamId });
      const members = [
        { id: '1', name: 'Member A' },
        { id: '2', name: 'Member B' },
      ];
      mocks.teamQuery.first.mockResolvedValue({ members });

      const result = await service.findAll(orgId, workspaceId, teamId);
      expect(result).toEqual(members);
    });
  });

  describe('findMemberTeams', () => {
    it('lists all teams for a member', async () => {
      membersService.findOne.mockResolvedValue({ id: memberId });
      const teams = [
        { id: '1', name: 'Team A' },
        { id: '2', name: 'Team B' },
      ];
      mocks.memberQuery.first.mockResolvedValue({ teams });

      const result = await service.findMemberTeams(orgId, memberId);
      expect(result).toEqual(teams);
    });

    it('throws if member not found', async () => {
      membersService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.findMemberTeams(orgId, memberId))
        .rejects.toThrow(NotFoundException);
    });
  });
});