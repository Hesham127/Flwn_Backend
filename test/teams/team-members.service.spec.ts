import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mocks = vi.hoisted(() => ({
  team: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  member: { findMany: vi.fn() },
}));
vi.mock('../../src/prisma/db.js', () => ({ db: mocks }));
import { TeamsService } from '../../src/teams/teams.service.js';

describe('TeamsService membership', () => {
  const orgId = 'org-uuid';
  const workspaceId = 'ws-uuid';
  const teamId = 'team-uuid';
  const memberId = 'member-uuid';
  const workspaceService = { findOne: vi.fn() };
  const membersService = { findOne: vi.fn() };
  let service: TeamsService;

  beforeEach(() => {
    vi.resetAllMocks();
    workspaceService.findOne.mockResolvedValue({ id: workspaceId });
    membersService.findOne.mockResolvedValue({ id: memberId });
    mocks.team.findFirst.mockResolvedValue({ id: teamId });
    service = new TeamsService(
      workspaceService as never,
      membersService as never,
    );
  });

  it('connects a member from the same organization', async () => {
    mocks.team.findFirst
      .mockResolvedValueOnce({ id: teamId })
      .mockResolvedValueOnce(null);
    mocks.team.update.mockResolvedValue({ id: teamId });
    expect(
      await service.addMember(orgId, workspaceId, teamId, memberId),
    ).toEqual({ id: teamId });
    expect(workspaceService.findOne).toHaveBeenCalledWith(orgId, workspaceId);
    expect(membersService.findOne).toHaveBeenCalledWith(orgId, memberId);
    expect(mocks.team.findFirst).toHaveBeenNthCalledWith(1, {
      where: { id: teamId, workspaceId },
    });
    expect(mocks.team.update).toHaveBeenCalledWith({
      where: { id: teamId, workspaceId },
      data: { members: { connect: { id: memberId, organizationId: orgId } } },
    });
  });

  it('rejects duplicate membership', async () => {
    await expect(
      service.addMember(orgId, workspaceId, teamId, memberId),
    ).rejects.toThrow(ConflictException);
    expect(mocks.team.update).not.toHaveBeenCalled();
  });

  it('rejects a missing team or a team in another workspace', async () => {
    mocks.team.findFirst.mockResolvedValue(null);
    await expect(
      service.addMember(orgId, workspaceId, teamId, memberId),
    ).rejects.toThrow(NotFoundException);
    expect(membersService.findOne).not.toHaveBeenCalled();
    expect(mocks.team.update).not.toHaveBeenCalled();
  });

  it('rejects a missing member or member in another organization', async () => {
    membersService.findOne.mockRejectedValue(new NotFoundException());
    await expect(
      service.addMember(orgId, workspaceId, teamId, memberId),
    ).rejects.toThrow(NotFoundException);
    expect(mocks.team.update).not.toHaveBeenCalled();
  });

  it('rejects an unavailable workspace before accessing teams', async () => {
    workspaceService.findOne.mockRejectedValue(new NotFoundException());
    await expect(
      service.addMember(orgId, workspaceId, teamId, memberId),
    ).rejects.toThrow(NotFoundException);
    expect(mocks.team.findFirst).not.toHaveBeenCalled();
    expect(mocks.team.update).not.toHaveBeenCalled();
  });

  it('disconnects membership without deleting the member', async () => {
    await service.removeMember(orgId, workspaceId, teamId, memberId);
    expect(mocks.team.update).toHaveBeenCalledWith({
      where: { id: teamId, workspaceId },
      data: { members: { disconnect: { id: memberId } } },
    });
  });

  it('rejects removing a member who has not joined', async () => {
    mocks.team.findFirst
      .mockResolvedValueOnce({ id: teamId })
      .mockResolvedValueOnce(null);
    await expect(
      service.removeMember(orgId, workspaceId, teamId, memberId),
    ).rejects.toThrow(NotFoundException);
    expect(mocks.team.update).not.toHaveBeenCalled();
  });

  it('lists members scoped to the team and organization', async () => {
    mocks.member.findMany.mockResolvedValue([{ id: memberId }]);
    expect(await service.findMembers(orgId, workspaceId, teamId)).toEqual([
      { id: memberId },
    ]);
    expect(mocks.member.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: orgId,
        teams: { some: { id: teamId, workspaceId } },
      },
    });
  });

  it('lists a member teams inside their organization', async () => {
    mocks.team.findMany.mockResolvedValue([{ id: teamId }]);
    expect(await service.findMemberTeams(orgId, memberId)).toEqual([
      { id: teamId },
    ]);
    expect(mocks.team.findMany).toHaveBeenCalledWith({
      where: {
        workspace: { organizationId: orgId },
        members: { some: { id: memberId } },
      },
    });
  });
});
