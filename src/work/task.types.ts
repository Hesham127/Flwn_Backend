import { TaskStatus } from './work.rules.js';

export interface TaskRecord {
  id: string;
  projectId: string;
  workItemId: string;
  createdById: string;
  sprintId: string | null;
  assigneeId: string | null;
  title: string;
  description: string | null;
  requirements: string | null;
  acceptanceCriteria: string | null;
  priority: string;
  status: TaskStatus;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  projectId: string;
  workItemId: string;
  createdById: string;
  sprintId?: string | null;
  assigneeId?: string | null;
  title: string;
  description?: string | null;
  requirements?: string | null;
  acceptanceCriteria?: string | null;
  priority?: string;
  status?: TaskStatus;
  dueDate?: Date | null;
  completedAt?: Date | null;
}

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'projectId' | 'workItemId' | 'createdById'>>;

export interface TaskRepository {
  create(input: CreateTaskInput): Promise<TaskRecord>;
  findById(id: string): Promise<TaskRecord | null>;
  findMany(filter: Partial<Pick<TaskRecord, 'workItemId' | 'sprintId' | 'projectId' | 'assigneeId'>>): Promise<TaskRecord[]>;
  update(id: string, input: UpdateTaskInput): Promise<TaskRecord | null>;
  delete(id: string): Promise<boolean>;
}