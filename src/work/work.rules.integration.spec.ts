import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  SprintStatus,
  TaskStatus,
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

  it('requires Task, WorkItem, Sprint, and assignee to share the Project', () => {
    expect(() =>
      rules.assertTaskAssignment({
        projectId: 'project-1',
        workItemProjectId: 'project-1',
        sprintProjectId: 'project-1',
        assigneeProjectId: 'project-1',
        assigneeIsActive: true,
        status: TaskStatus.IN_PROGRESS,
      }),
    ).not.toThrow();

    expect(() =>
      rules.assertTaskAssignment({
        projectId: 'project-1',
        workItemProjectId: 'project-2',
        status: TaskStatus.TODO,
      }),
    ).toThrow(BadRequestException);
  });

  it('requires active assignees and consistent completedAt', () => {
    expect(() =>
      rules.assertTaskAssignment({
        projectId: 'project-1',
        workItemProjectId: 'project-1',
        assigneeProjectId: 'project-1',
        assigneeIsActive: false,
        status: TaskStatus.TODO,
      }),
    ).toThrow(BadRequestException);

    expect(() => rules.assertCompletedAt(TaskStatus.DONE, null)).toThrow(
      BadRequestException,
    );
    expect(() =>
      rules.assertCompletedAt(TaskStatus.IN_PROGRESS, new Date()),
    ).toThrow(
      BadRequestException,
    );
    expect(() =>
      rules.assertCompletedAt(TaskStatus.DONE, new Date()),
    ).not.toThrow();
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