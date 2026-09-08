import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  SprintStatus,
  WorkRulesService,
} from './work.rules';

describe('Work planning project rules (integration)', () => {
  let rules: WorkRulesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [WorkRulesService],
    }).compile();

    rules = moduleRef.get(WorkRulesService);
  });

  it('allows a WorkItem when its Backlog belongs to the requested Project', () => {
    expect(() =>
      rules.assertBacklogCanCreateWorkItem('project-1', {
        projectId: 'project-1',
      }),
    ).not.toThrow();
  });

  it('rejects a WorkItem when its Backlog belongs to another Project', () => {
    expect(() =>
      rules.assertBacklogCanCreateWorkItem('project-1', {
        projectId: 'project-2',
      }),
    ).toThrow(BadRequestException);
  });

  it('allows a Sprint assignment when the Sprint belongs to the WorkItem Project', () => {
    expect(() =>
      rules.assertTaskCanJoinSprint('project-1', { projectId: 'project-1' }),
    ).not.toThrow();
  });

  it('rejects a Sprint assignment across Projects', () => {
    expect(() =>
      rules.assertTaskCanJoinSprint('project-1', { projectId: 'project-2' }),
    ).toThrow(BadRequestException);
  });

  it('keeps terminal Sprint states terminal', () => {
    expect(() =>
      rules.assertSprintTransition(SprintStatus.COMPLETED, SprintStatus.ACTIVE),
    ).toThrow(BadRequestException);
    expect(() =>
      rules.assertSprintTransition(SprintStatus.CANCELLED, SprintStatus.PLANNED),
    ).toThrow(BadRequestException);
  });
});