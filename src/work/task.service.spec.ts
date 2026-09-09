import { Test } from '@nestjs/testing';
import { TaskStatus, WorkRulesService } from './work.rules.js';
import { InMemoryTaskRepository } from './task.repository.js';
import { TaskService } from './task.service.js';
import { OrganizationMembershipService } from '../organization/organization-membership.service.js';

describe('TaskService', () => {
  let service: TaskService;
  let membership: OrganizationMembershipService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkRulesService,
        InMemoryTaskRepository,
        { provide: 'TASK_REPOSITORY', useExisting: InMemoryTaskRepository },
        OrganizationMembershipService,
        { provide: 'ORGANIZATION_MEMBERSHIP', useExisting: OrganizationMembershipService },
        TaskService,
      ],
    }).compile();

    service = moduleRef.get(TaskService);
    membership = moduleRef.get(OrganizationMembershipService);
  });

  it('creates and reads a Task', async () => {
    const created = await service.create({
      projectId: 'project-1',
      workItemId: 'work-item-1',
      createdById: 'member-1',
      title: 'Implement task CRUD',
    });

    await expect(service.findById(created.id)).resolves.toMatchObject({
      title: 'Implement task CRUD',
      status: TaskStatus.TODO,
    });
  });

  it('lists Tasks by project, work item, sprint, and assignee', async () => {
    await service.create({
      projectId: 'project-1',
      workItemId: 'work-item-1',
      createdById: 'member-1',
      sprintId: 'sprint-1',
      assigneeId: 'member-2',
      title: 'Filtered task',
    });
    await service.create({
      projectId: 'project-2',
      workItemId: 'work-item-2',
      createdById: 'member-3',
      title: 'Other task',
    });

    await expect(service.findMany({ projectId: 'project-1' })).resolves.toHaveLength(1);
    await expect(service.findMany({ workItemId: 'work-item-1' })).resolves.toHaveLength(1);
    await expect(service.findMany({ sprintId: 'sprint-1' })).resolves.toHaveLength(1);
    await expect(service.findMany({ assigneeId: 'member-2' })).resolves.toHaveLength(1);
  });

  it('updates and deletes a Task', async () => {
    const task = await service.create({
      projectId: 'project-1',
      workItemId: 'work-item-1',
      createdById: 'member-1',
      title: 'Old title',
    });

    await expect(service.update(task.id, { title: 'New title' })).resolves.toMatchObject({
      title: 'New title',
    });
    await expect(service.delete(task.id)).resolves.toBeUndefined();
    await expect(service.findById(task.id)).rejects.toThrow('Task not found');
  });

  it('assigns and unassigns a task through active project membership', async () => {
    membership.addProjectMember('project-1', 'member-2');
    const task = await service.create({
      projectId: 'project-1',
      workItemId: 'work-item-1',
      createdById: 'member-1',
      title: 'Assign me',
    });

    await expect(service.assign(task.id, 'member-2')).resolves.toMatchObject({
      assigneeId: 'member-2',
    });
    await expect(service.unassign(task.id)).resolves.toMatchObject({
      assigneeId: null,
    });
  });

  it('rejects assignment to a missing, inactive, or cross-project member', async () => {
    const task = await service.create({
      projectId: 'project-1',
      workItemId: 'work-item-1',
      createdById: 'member-1',
      title: 'Validate assignment',
    });

    await expect(service.assign(task.id, 'missing')).rejects.toThrow(
      'project member',
    );
    membership.addProjectMember('project-1', 'inactive', 'INACTIVE');
    await expect(service.assign(task.id, 'inactive')).rejects.toThrow(
      'Assignee must be active',
    );
    membership.addProjectMember('project-2', 'other-project');
    await expect(service.assign(task.id, 'other-project')).rejects.toThrow(
      'project member',
    );
  });
});