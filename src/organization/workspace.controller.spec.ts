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

import { WorkspaceController } from './workspace.controller.js';
import { WorkspaceService } from './workspace.service.js';

describe('WorkspaceController', () => {
  let app: INestApplication;

  const organizationId =
    '550e8400-e29b-41d4-a716-446655440000';

  const workspaceId =
    '550e8400-e29b-41d4-a716-446655440001';

  const workspace = {
    id: workspaceId,
    organizationId,
    name: 'Engineering',
    description: 'Engineering workspace',
    archivedAt: null,
  };

  const service = {
    create: vi.fn(),
    findByOrganization: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [WorkspaceController],
      providers: [
        {
          provide: WorkspaceService,
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

  it('creates a workspace', async () => {
    service.create.mockResolvedValue(workspace);

    await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/workspaces`)
      .send({
        name: 'Engineering',
        description: 'Engineering workspace',
      })
      .expect(201);
  });

  it('rejects invalid workspace data', async () => {
    await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/workspaces`)
      .send({})
      .expect(400);
  });

  it('requires an existing organization', async () => {
    service.create.mockRejectedValue(
      new NotFoundException({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      }),
    );

    const response = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/workspaces`)
      .send({
        name: 'Engineering',
      })
      .expect(404);

    expect(response.body.code).toBe(
      'ORGANIZATION_NOT_FOUND',
    );
  });

  it('lists workspaces by organization', async () => {
    service.findByOrganization.mockResolvedValue([
      workspace,
    ]);

    await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/workspaces`)
      .expect(200);
  });

  it('gets one workspace', async () => {
    service.findOne.mockResolvedValue(workspace);

    await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/workspaces/${workspaceId}`,
      )
      .expect(200);
  });

  it('returns WORKSPACE_NOT_FOUND', async () => {
    service.findOne.mockRejectedValue(
      new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found',
      }),
    );

    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/workspaces/${workspaceId}`,
      )
      .expect(404);

    expect(response.body.code).toBe(
      'WORKSPACE_NOT_FOUND',
    );
  });

  it('updates a workspace', async () => {
    service.update.mockResolvedValue({
      ...workspace,
      name: 'Updated Engineering',
    });

    await request(app.getHttpServer())
      .patch(
        `/organizations/${organizationId}/workspaces/${workspaceId}`,
      )
      .send({
        name: 'Updated Engineering',
      })
      .expect(200);
  });

  it('does not allow organizationId to change', async () => {
    await request(app.getHttpServer())
      .patch(
        `/organizations/${organizationId}/workspaces/${workspaceId}`,
      )
      .send({
        organizationId:
          '550e8400-e29b-41d4-a716-446655440099',
      })
      .expect(400);
  });

  it('archives a workspace', async () => {
    service.remove.mockResolvedValue({
      id: workspaceId,
      archived: true,
    });

    await request(app.getHttpServer())
      .delete(
        `/organizations/${organizationId}/workspaces/${workspaceId}`,
      )
      .expect(200)
      .expect({
        id: workspaceId,
        archived: true,
      });
  });
});