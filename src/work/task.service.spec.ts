import { Test } from '@nestjs/testing';
import { TaskStatus, WorkRulesService } from './work.rules.js';
import { InMemoryTaskRepository } from './task.repository.js';
import { TaskService } from './task.service.js';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkRulesService,
        InMemoryTaskRepository,
        { provide: 'TASK_REPOSITORY', useExisting: InMemoryTaskRepository },
        TaskService,
      ],
    }).compile();

    service = moduleRef.get(TaskService);
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
});