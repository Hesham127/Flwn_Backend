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
  ConflictException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';

import { Test } from '@nestjs/testing';
import request from 'supertest';

import { MembersController } from './members.controller.js';
import { MembersService } from './members.service.js';

describe('MembersController', () => {
  let app: INestApplication;

  const organizationId =
    '550e8400-e29b-41d4-a716-446655440000';

  const memberId =
    '550e8400-e29b-41d4-a716-446655440001';

  const member = {
    id: memberId,
    organizationId,
    name: 'Anas Ahmed',
    email: 'anas@example.com',
    type: 'HUMAN',
    role: 'DEVELOPER',
    status: 'ACTIVE',
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
      controllers: [MembersController],
      providers: [
        {
          provide: MembersService,
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

  it('creates a member', async () => {
    service.create.mockResolvedValue(member);

    await request(app.getHttpServer())
      .post(
        `/organizations/${organizationId}/members`,
      )
      .send({
        name: 'Anas Ahmed',
        email: 'anas@example.com',
        type: 'HUMAN',
        role: 'DEVELOPER',
      })
      .expect(201);
  });

  it('rejects invalid create data', async () => {
    await request(app.getHttpServer())
      .post(
        `/organizations/${organizationId}/members`,
      )
      .send({})
      .expect(400);

    expect(
      service.create,
    ).not.toHaveBeenCalled();
  });

  it('returns conflict for duplicate member email', async () => {
    service.create.mockRejectedValue(
      new ConflictException({
        code: 'MEMBER_ALREADY_EXISTS',
        message:
          'Member with email "anas@example.com" already exists in this organization.',
      }),
    );

    const response = await request(
      app.getHttpServer(),
    )
      .post(
        `/organizations/${organizationId}/members`,
      )
      .send({
        name: 'Anas Ahmed',
        email: 'anas@example.com',
        type: 'HUMAN',
        role: 'DEVELOPER',
      })
      .expect(409);

    expect(response.body.code).toBe(
      'MEMBER_ALREADY_EXISTS',
    );
  });

  it('lists members', async () => {
    service.findAll.mockResolvedValue([member]);

    await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/members`,
      )
      .expect(200);

    expect(
      service.findAll,
    ).toHaveBeenCalled();
  });

  it('returns one member', async () => {
    service.findOne.mockResolvedValue(member);

    await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/members/${memberId}`,
      )
      .expect(200);
  });

  it('returns MEMBER_NOT_FOUND error', async () => {
    service.findOne.mockRejectedValue(
      new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found',
      }),
    );

    const response = await request(
      app.getHttpServer(),
    )
      .get(
        `/organizations/${organizationId}/members/${memberId}`,
      )
      .expect(404);

    expect(response.body.code).toBe(
      'MEMBER_NOT_FOUND',
    );
  });

  it('updates a member', async () => {
    service.update.mockResolvedValue({
      ...member,
      name: 'Anas Updated',
    });

    await request(app.getHttpServer())
      .patch(
        `/organizations/${organizationId}/members/${memberId}`,
      )
      .send({
        name: 'Anas Updated',
      })
      .expect(200);
  });

  it('rejects empty update data', async () => {
    await request(app.getHttpServer())
      .patch(
        `/organizations/${organizationId}/members/${memberId}`,
      )
      .send({})
      .expect(400);

    expect(
      service.update,
    ).not.toHaveBeenCalled();
  });

  it('deactivates a member', async () => {
    service.remove.mockResolvedValue({
      id: memberId,
      status: 'INACTIVE',
    });

    const response = await request(
      app.getHttpServer(),
    )
      .delete(
        `/organizations/${organizationId}/members/${memberId}`,
      )
      .expect(200);

    expect(response.body).toEqual({
      id: memberId,
      status: 'INACTIVE',
    });
  });
});