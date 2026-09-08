import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => {
  const teamMemberQuery = {
    where: vi.fn(),
    first: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  };
  const memberQuery = {
    where: vi.fn(),
    some: vi.fn(),
    all: vi.fn(),
  };
  const teamQuery = {
    where: vi.fn(),
    some: vi.fn(),
    all: vi.fn(),
  };
  return { teamMemberQuery, memberQuery, teamQuery };
});

vi.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        TeamMember: mocks.teamMemberQuery,
        Member: mocks.memberQuery,
        Team: mocks.teamQuery,
      },
    },
  },
}));

import { TeamMembersService } from './team-members.service.js';
import { MembersService } from '../members/members.service.js';
import { TeamsService } from '../teams/teams.service.js';
import { OrganizationWorkspaceLookupService } from '../organization/organization-workspace-lookup.service.js';

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
    mocks.teamMemberQuery.where.mockReturnValue(mocks.teamMemberQuery);
    mocks.memberQuery.where.mockReturnValue(mocks.memberQuery);
    mocks.teamQuery.where.mockReturnValue(mocks.teamQuery);

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
      mocks.teamMemberQuery.first.mockResolvedValue(null);
      mocks.teamMemberQuery.create.mockResolvedValue({ teamId, memberId });

      const result = await service.add(orgId, workspaceId, teamId, memberId);
      expect(result).toEqual({ teamId, memberId });
      expect(mocks.teamMemberQuery.create).toHaveBeenCalledWith({ teamId, memberId });
    });

    it('throws if member already in team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      teamsService.findOne.mockResolvedValue({ id: teamId });
      membersService.findOne.mockResolvedValue({ id: memberId });
      mocks.teamMemberQuery.first.mockResolvedValue({ teamId, memberId });

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
      mocks.teamMemberQuery.first.mockResolvedValue({ teamId, memberId });
      mocks.teamMemberQuery.delete.mockResolvedValue({});

      await service.remove(orgId, workspaceId, teamId, memberId);
      expect(mocks.teamMemberQuery.delete).toHaveBeenCalled();
    });

    it('throws if member not in team', async () => {
      lookupService.assertWorkspaceInOrganization.mockResolvedValue(undefined);
      teamsService.findOne.mockResolvedValue({ id: teamId });
      membersService.findOne.mockResolvedValue({ id: memberId });
      mocks.teamMemberQuery.first.mockResolvedValue(null);

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
      mocks.memberQuery.all.mockResolvedValue(members);

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
      mocks.teamQuery.all.mockResolvedValue(teams);

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