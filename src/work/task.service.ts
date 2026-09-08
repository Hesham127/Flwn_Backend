import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus, WorkRulesService } from './work.rules.js';
import type {
  CreateTaskInput,
  TaskRecord,
  TaskRepository,
  UpdateTaskInput,
} from './task.types.js';

@Injectable()
export class TaskService {
  constructor(
    @Inject('TASK_REPOSITORY') private readonly repository: TaskRepository,
    private readonly rules: WorkRulesService,
  ) {}

  async create(input: CreateTaskInput): Promise<TaskRecord> {
    this.rules.assertTaskAssignment({
      projectId: input.projectId,
      workItemProjectId: input.projectId,
      creatorProjectId: input.projectId,
      creatorIsActive: true,
      sprintProjectId: input.sprintId ? input.projectId : null,
      assigneeProjectId: input.assigneeId ? input.projectId : null,
      assigneeIsActive: true,
      status: input.status ?? TaskStatus.TODO,
      completedAt: input.completedAt,
    });
    this.rules.assertCompletedAt(
      input.status ?? TaskStatus.TODO,
      input.completedAt ?? null,
    );
    return this.repository.create(input);
  }

  async findById(id: string): Promise<TaskRecord> {
    const task = await this.repository.findById(id);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  findMany(filter: Partial<Pick<TaskRecord, 'workItemId' | 'sprintId' | 'projectId' | 'assigneeId'>>): Promise<TaskRecord[]> {
    return this.repository.findMany(filter);
  }

  async update(id: string, input: UpdateTaskInput): Promise<TaskRecord> {
    const current = await this.findById(id);
    const status = input.status ?? current.status;
    const completedAt = input.completedAt === undefined ? current.completedAt : input.completedAt;
    this.rules.assertCompletedAt(status, completedAt ?? null);
    const task = await this.repository.update(id, input);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) throw new NotFoundException('Task not found');
  }
}