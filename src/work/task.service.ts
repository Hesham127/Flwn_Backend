import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus, WorkRulesService } from './work.rules.js';
import type {
  CreateTaskInput,
  TaskMembershipLookup,
  TaskRecord,
  TaskRepository,
  UpdateTaskInput,
} from './task.types.js';

@Injectable()
export class TaskService {
  constructor(
    @Inject('TASK_REPOSITORY') private readonly repository: TaskRepository,
    private readonly rules: WorkRulesService,
    @Inject('ORGANIZATION_MEMBERSHIP')
    private readonly membership: TaskMembershipLookup,
  ) {}

  async create(input: CreateTaskInput): Promise<TaskRecord> {
    const status = input.status ?? TaskStatus.TODO;
    this.rules.assertTaskStatus(status);
    this.rules.assertTaskAssignment({
      projectId: input.projectId,
      workItemProjectId: input.projectId,
      creatorProjectId: input.projectId,
      creatorIsActive: true,
      sprintProjectId: input.sprintId ? input.projectId : null,
      assigneeProjectId: input.assigneeId ? input.projectId : null,
      assigneeIsActive: true,
      status,
      completedAt: input.completedAt,
    });
    this.rules.assertCompletedAt(
      status,
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
    this.rules.assertTaskStatus(status);
    const completedAt = this.resolveCompletedAt(
      current,
      status,
      input.completedAt,
    );
    this.rules.assertCompletedAt(status, completedAt ?? null);
    const task = await this.repository.update(id, {
      ...input,
      ...(input.status !== undefined || input.completedAt !== undefined
        ? { status, completedAt }
        : {}),
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async transition(id: string, status: TaskStatus): Promise<TaskRecord> {
    await this.findById(id);
    this.rules.assertTaskStatus(status);
    const completedAt = status === TaskStatus.DONE ? new Date() : null;
    this.rules.assertCompletedAt(status, completedAt);

    const task = await this.repository.update(id, { status, completedAt });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  private resolveCompletedAt(
    current: TaskRecord,
    status: TaskStatus,
    completedAt: Date | null | undefined,
  ): Date | null {
    if (completedAt !== undefined) return completedAt;
    if (status !== TaskStatus.DONE) return null;
    return current.status === TaskStatus.DONE && current.completedAt
      ? current.completedAt
      : new Date();
  }

  async assign(id: string, assigneeId: string): Promise<TaskRecord> {
    const current = await this.findById(id);
    if (!assigneeId) throw new BadRequestException('Assignee is required');

    const member = await this.membership.findProjectMember(
      current.projectId,
      assigneeId,
    );
    if (!member) {
      throw new BadRequestException('Assignee must be a project member');
    }

    this.rules.assertMemberCanWorkOnProject(current.projectId, member, 'Assignee');
    const task = await this.repository.update(id, { assigneeId });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async unassign(id: string): Promise<TaskRecord> {
    await this.findById(id);
    const task = await this.repository.update(id, { assigneeId: null });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) throw new NotFoundException('Task not found');
  }
}