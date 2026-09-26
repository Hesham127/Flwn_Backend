import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  organization: { findFirst: vi.fn() },
  workspace: { findFirst: vi.fn() },
  member: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
  team: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
}));
vi.mock('../../src/prisma/db.js', () => ({ db: mocks }));
import { TeamsModule } from '../../src/teams/teams.module.js';

describe('Teams and members HTTP integration', () => {
  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  const workspaceId = '550e8400-e29b-41d4-a716-446655440001';
  const teamId = '550e8400-e29b-41d4-a716-446655440002';
  const memberId = '550e8400-e29b-41d4-a716-446655440003';
  const team = { id: teamId, workspaceId, name: 'Backend', description: null };
  const member = {
    id: memberId,
    organizationId: orgId,
    name: 'Anas',
    email: 'anas@example.com',
    type: 'HUMAN',
    role: 'DEVELOPER',
    status: 'ACTIVE',
  };
  const base = `/organizations/${orgId}/workspaces/${workspaceId}/teams`;
  let app: INestApplication;

  beforeEach(async () => {
    vi.resetAllMocks();
    mocks.organization.findFirst.mockResolvedValue({ id: orgId });
    mocks.workspace.findFirst.mockResolvedValue({
      id: workspaceId,
      organizationId: orgId,
    });
    const moduleRef = await Test.createTestingModule({
      imports: [TeamsModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('creates a team and member, joins, lists, and removes membership through real services', async () => {
    mocks.team.create.mockResolvedValue(team);
    await request(app.getHttpServer())
      .post(base)
      .send({ name: 'Backend' })
      .expect(201)
      .expect(team);
    mocks.member.findFirst.mockResolvedValueOnce(null);
    mocks.member.create.mockResolvedValue(member);
    await request(app.getHttpServer())
      .post(`/organizations/${orgId}/members`)
      .send({
        name: 'Anas',
        email: 'anas@example.com',
        type: 'HUMAN',
        role: 'DEVELOPER',
      })
      .expect(201)
      .expect(member);

    mocks.member.findFirst.mockResolvedValue(member);
    mocks.team.findFirst
      .mockResolvedValueOnce(team)
      .mockResolvedValueOnce(null);
    mocks.team.update.mockResolvedValue(team);
    await request(app.getHttpServer())
      .post(`${base}/${teamId}/members`)
      .send({ memberId })
      .expect(201);
    expect(mocks.team.update).toHaveBeenCalledWith({
      where: { id: teamId, workspaceId },
      data: { members: { connect: { id: memberId, organizationId: orgId } } },
    });

    mocks.team.findFirst.mockResolvedValue(team);
    mocks.member.findMany.mockResolvedValue([member]);
    await request(app.getHttpServer())
      .get(`${base}/${teamId}/members`)
      .expect(200)
      .expect([member]);
    await request(app.getHttpServer())
      .post(`${base}/${teamId}/members`)
      .send({ memberId })
      .expect(409);
    expect(mocks.team.update).toHaveBeenCalledTimes(1);
    await request(app.getHttpServer())
      .delete(`${base}/${teamId}/members/${memberId}`)
      .expect(204);
    expect(mocks.team.update).toHaveBeenLastCalledWith({
      where: { id: teamId, workspaceId },
      data: { members: { disconnect: { id: memberId } } },
    });
  });

  it('rejects a member outside the organization without changing membership', async () => {
    mocks.team.findFirst.mockResolvedValue(team);
    mocks.member.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post(`${base}/${teamId}/members`)
      .send({ memberId })
      .expect(404);
    expect(mocks.member.findFirst).toHaveBeenCalledWith({
      where: { id: memberId, organizationId: orgId },
    });
    expect(mocks.team.update).not.toHaveBeenCalled();
  });

  it('rejects a workspace outside the organization before querying teams', async () => {
    mocks.workspace.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post(`${base}/${teamId}/members`)
      .send({ memberId })
      .expect(404);
    expect(mocks.workspace.findFirst).toHaveBeenCalledWith({
      where: { id: workspaceId, organizationId: orgId, archivedAt: null },
    });
    expect(mocks.team.findFirst).not.toHaveBeenCalled();
    expect(mocks.team.update).not.toHaveBeenCalled();
  });
});
