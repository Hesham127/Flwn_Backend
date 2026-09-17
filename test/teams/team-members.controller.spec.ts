import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/prisma/db.js', () => ({ db: {} }));

import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { TeamMembersController } from '../../src/teams/team-members.controller.js';
import { TeamMembersService } from '../../src/teams/team-members.service.js';

describe('TeamMembersController', () => {
  let app: INestApplication;
  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  const wsId = '550e8400-e29b-41d4-a716-446655440001';
  const teamId = '550e8400-e29b-41d4-a716-446655440002';
  const memberId = '550e8400-e29b-41d4-a716-446655440003';

  const service = {
    findAll: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    findMemberTeams: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [TeamMembersController],
      providers: [{ provide: TeamMembersService, useValue: service }],
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
    await app.close();
  });

  it('GET / lists team members', async () => {
    service.findAll.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get(`/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}/members`)
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith(orgId, wsId, teamId);
  });

  it('POST / adds a member to a team', async () => {
    service.add.mockResolvedValue({ teamId, memberId });
    await request(app.getHttpServer())
      .post(`/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}/members`)
      .send({ memberId })
      .expect(201);
    expect(service.add).toHaveBeenCalledWith(orgId, wsId, teamId, memberId);
  });

  it('rejects invalid POST data (missing memberId)', async () => {
    await request(app.getHttpServer())
      .post(`/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}/members`)
      .send({})
      .expect(400);
  });

  it('DELETE /:memberId removes a member from a team', async () => {
    service.remove.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .delete(`/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}/members/${memberId}`)
      .expect(204);
    expect(service.remove).toHaveBeenCalledWith(orgId, wsId, teamId, memberId);
  });

  it('returns 404 when team not found', async () => {
    service.findAll.mockRejectedValue(
      new NotFoundException({ code: 'TEAM_NOT_FOUND' }),
    );
    await request(app.getHttpServer())
      .get(`/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}/members`)
      .expect(404);
  });

  it('GET /member/:memberId/teams lists member teams', async () => {
    service.findMemberTeams.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get(`/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}/members/member/${memberId}/teams`)
      .expect(200);
    expect(service.findMemberTeams).toHaveBeenCalledWith(orgId, memberId);
  });
});