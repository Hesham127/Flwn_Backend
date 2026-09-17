import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CreateTaskInput,
  TaskRecord,
  TaskRepository,
  UpdateTaskInput,
} from './task.types.js';
import { TaskStatus } from './work.rules.js';

@Injectable()
export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, TaskRecord>();

  async create(input: CreateTaskInput): Promise<TaskRecord> {
    const now = new Date();
    const task: TaskRecord = {
      id: randomUUID(),
      projectId: input.projectId,
      workItemId: input.workItemId,
      createdById: input.createdById,
      sprintId: input.sprintId ?? null,
      assigneeId: input.assigneeId ?? null,
      title: input.title,
      description: input.description ?? null,
      requirements: input.requirements ?? null,
      acceptanceCriteria: input.acceptanceCriteria ?? null,
      priority: input.priority ?? 'MEDIUM',
      status: input.status ?? TaskStatus.TODO,
      dueDate: input.dueDate ?? null,
      completedAt: input.completedAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async findById(id: string): Promise<TaskRecord | null> {
    return this.tasks.get(id) ?? null;
  }

  async findMany(filter: Partial<Pick<TaskRecord, 'workItemId' | 'sprintId' | 'projectId' | 'assigneeId'>>): Promise<TaskRecord[]> {
    return [...this.tasks.values()].filter((task) =>
      Object.entries(filter).every(([key, value]) => task[key as keyof typeof task] === value),
    );
  }

  async update(id: string, input: UpdateTaskInput): Promise<TaskRecord | null> {
    const task = this.tasks.get(id);
    if (!task) return null;
    const updated = { ...task, ...input, updatedAt: new Date() };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}