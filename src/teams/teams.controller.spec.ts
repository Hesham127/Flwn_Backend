import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.mock('../prisma/db.js', () => ({
  db: {},
}));

import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';

import { Test } from '@nestjs/testing';
import request from 'supertest';

import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';

describe('TeamsController', () => {
  let app: INestApplication;

  const orgId =
    '550e8400-e29b-41d4-a716-446655440000';

  const wsId =
    '550e8400-e29b-41d4-a716-446655440001';

  const teamId =
    '550e8400-e29b-41d4-a716-446655440002';

  const team = {
    id: teamId,
    workspaceId: wsId,
    name: 'Backend Team',
    description: 'API',
  };

  const service = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: service,
        },
      ],
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

  it('POST / creates a team', async () => {
    service.create.mockResolvedValue(team);

    await request(app.getHttpServer())
      .post(
        `/organizations/${orgId}/workspaces/${wsId}/teams`,
      )
      .send({
        name: 'Backend Team',
        description: 'API',
      })
      .expect(201);

    expect(service.create).toHaveBeenCalledWith(
      orgId,
      wsId,
      {
        name: 'Backend Team',
        description: 'API',
      },
    );
  });

  it('rejects invalid create data', async () => {
    await request(app.getHttpServer())
      .post(
        `/organizations/${orgId}/workspaces/${wsId}/teams`,
      )
      .send({})
      .expect(400);

    expect(service.create).not.toHaveBeenCalled();
  });

  it('GET / lists teams', async () => {
    service.findAll.mockResolvedValue([team]);

    await request(app.getHttpServer())
      .get(
        `/organizations/${orgId}/workspaces/${wsId}/teams`,
      )
      .expect(200);

    expect(service.findAll).toHaveBeenCalledWith(
      orgId,
      wsId,
      {},
    );
  });

  it('GET /:id returns a team', async () => {
    service.findOne.mockResolvedValue(team);

    await request(app.getHttpServer())
      .get(
        `/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}`,
      )
      .expect(200);

    expect(service.findOne).toHaveBeenCalledWith(
      orgId,
      wsId,
      teamId,
    );
  });

  it('PATCH /:id updates a team', async () => {
    service.update.mockResolvedValue({
      ...team,
      name: 'Updated',
    });

    await request(app.getHttpServer())
      .patch(
        `/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}`,
      )
      .send({
        name: 'Updated',
      })
      .expect(200);

    expect(service.update).toHaveBeenCalledWith(
      orgId,
      wsId,
      teamId,
      {
        name: 'Updated',
      },
    );
  });

  it('rejects empty update data', async () => {
    await request(app.getHttpServer())
      .patch(
        `/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}`,
      )
      .send({})
      .expect(400);

    expect(service.update).not.toHaveBeenCalled();
  });

  it('DELETE /:id deletes a team (204)', async () => {
    service.remove.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(
        `/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}`,
      )
      .expect(204);

    expect(service.remove).toHaveBeenCalledWith(
      orgId,
      wsId,
      teamId,
    );
  });

  it('returns 404 when team not found', async () => {
    service.findOne.mockRejectedValue(
      new NotFoundException({
        code: 'TEAM_NOT_FOUND',
        message: 'Team not found',
      }),
    );

    const response = await request(
      app.getHttpServer(),
    )
      .get(
        `/organizations/${orgId}/workspaces/${wsId}/teams/${teamId}`,
      )
      .expect(404);

    expect(response.body.code).toBe(
      'TEAM_NOT_FOUND',
    );
  });
});