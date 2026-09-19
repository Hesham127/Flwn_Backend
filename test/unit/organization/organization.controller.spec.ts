import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/prisma/db.js', () => ({
  db: {},
}));

import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { OrganizationController } from '../../../src/organization/organization.controller.js';
import { OrganizationService } from '../../../src/organization/organization.service.js';

describe('OrganizationController', () => {
  let app: INestApplication;

  const organizationId = '550e8400-e29b-41d4-a716-446655440000';

  const organization = {
    id: organizationId,
    name: 'Flwn',
    description: 'Graduation project organization',
    archivedAt: null,
  };

  const service = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
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

  it('creates an organization', async () => {
    service.create.mockResolvedValue(organization);

    await request(app.getHttpServer())
      .post('/organizations')
      .send({
        name: 'Flwn',
        description: 'Graduation project organization',
      })
      .expect(201)
      .expect(organization);

    expect(service.create).toHaveBeenCalledExactlyOnceWith({
      name: 'Flwn',
      description: 'Graduation project organization',
    });
  });

  it('rejects invalid create data', async () => {
    await request(app.getHttpServer())
      .post('/organizations')
      .send({})
      .expect(400);

    expect(service.create).not.toHaveBeenCalled();
  });

  it('lists organizations', async () => {
    service.findAll.mockResolvedValue([organization]);

    await request(app.getHttpServer())
      .get('/organizations')
      .expect(200)
      .expect([organization]);

    expect(service.findAll).toHaveBeenCalledExactlyOnceWith();
  });

  it('returns one organization', async () => {
    service.findOne.mockResolvedValue(organization);

    await request(app.getHttpServer())
      .get(`/organizations/${organizationId}`)
      .expect(200)
      .expect(organization);

    expect(service.findOne).toHaveBeenCalledExactlyOnceWith(organizationId);
  });

  it('returns machine-readable not found error', async () => {
    service.findOne.mockRejectedValue(
      new NotFoundException({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      }),
    );

    const response = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}`)
      .expect(404);

    expect(response.body.code).toBe('ORGANIZATION_NOT_FOUND');
  });

  it('updates an organization', async () => {
    service.update.mockResolvedValue({
      ...organization,
      name: 'Flwn Updated',
    });

    await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}`)
      .send({
        name: 'Flwn Updated',
      })
      .expect(200)
      .expect({ ...organization, name: 'Flwn Updated' });

    expect(service.update).toHaveBeenCalledExactlyOnceWith(organizationId, {
      name: 'Flwn Updated',
    });
  });

  it('rejects empty update data', async () => {
    await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}`)
      .send({})
      .expect(400);

    expect(service.update).not.toHaveBeenCalled();
  });

  it('rejects a null name on update', async () => {
    await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}`)
      .send({ name: null })
      .expect(400);

    expect(service.update).not.toHaveBeenCalled();
  });

  it('allows clearing the description without supplying a name', async () => {
    const updated = { ...organization, description: null };
    service.update.mockResolvedValue(updated);

    await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}`)
      .send({ description: null })
      .expect(200)
      .expect(updated);

    expect(service.update).toHaveBeenCalledExactlyOnceWith(organizationId, {
      description: null,
    });
  });

  it('archives an organization', async () => {
    service.remove.mockResolvedValue({
      id: organizationId,
      archived: true,
    });

    await request(app.getHttpServer())
      .delete(`/organizations/${organizationId}`)
      .expect(200)
      .expect({ id: organizationId, archived: true });

    expect(service.remove).toHaveBeenCalledExactlyOnceWith(organizationId);
  });
});
