import { BadRequestException, Injectable } from '@nestjs/common';

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export interface ProjectScopedRecord {
  projectId: string;
}

export interface TaskAssignmentInput extends ProjectScopedRecord {
  workItemProjectId: string;
  creatorProjectId: string;
  creatorIsActive: boolean;
  sprintProjectId?: string | null;
  assigneeProjectId?: string | null;
  assigneeIsActive?: boolean;
  status: TaskStatus;
  completedAt?: Date | null;
}

export interface ProjectMemberRecord extends ProjectScopedRecord {
  status: 'ACTIVE' | 'INACTIVE';
}

const allowedTransitions: Readonly<Record<SprintStatus, readonly SprintStatus[]>> = {
  [SprintStatus.PLANNED]: [SprintStatus.ACTIVE, SprintStatus.CANCELLED],
  [SprintStatus.ACTIVE]: [SprintStatus.COMPLETED, SprintStatus.CANCELLED],
  [SprintStatus.COMPLETED]: [],
  [SprintStatus.CANCELLED]: [],
};

@Injectable()
export class WorkRulesService {
  assertMemberCanWorkOnProject(
    projectId: string,
    member: ProjectMemberRecord,
    memberName: string,
  ): void {
    this.assertSameProject(projectId, member, memberName);

    if (member.status !== 'ACTIVE') {
      throw new BadRequestException(`${memberName} must be active`);
    }
  }

  assertSameProject(
    expectedProjectId: string,
    record: ProjectScopedRecord,
    resourceName: string,
  ): void {
    if (record.projectId !== expectedProjectId) {
      throw new BadRequestException(
        `${resourceName} does not belong to project ${expectedProjectId}`,
      );
    }
  }

  assertBacklogCanCreateWorkItem(
    projectId: string,
    backlog: ProjectScopedRecord,
  ): void {
    this.assertSameProject(projectId, backlog, 'Backlog');
  }

  assertSprintBelongsToProject(
    projectId: string,
    sprint: ProjectScopedRecord,
  ): void {
    this.assertSameProject(projectId, sprint, 'Sprint');
  }

  assertTaskCanJoinSprint(
    workItemProjectId: string,
    sprint: ProjectScopedRecord,
  ): void {
    this.assertSprintBelongsToProject(workItemProjectId, sprint);
  }

  assertTaskAssignment(input: TaskAssignmentInput): void {
    this.assertSameProject(input.projectId, {
      projectId: input.workItemProjectId,
    }, 'WorkItem');
    this.assertSameProject(input.projectId, {
      projectId: input.creatorProjectId,
    }, 'Creator');

    if (!input.creatorIsActive) {
      throw new BadRequestException('Creator must be active');
    }

    if (input.sprintProjectId) {
      this.assertSameProject(input.projectId, {
        projectId: input.sprintProjectId,
      }, 'Sprint');
    }

    if (input.assigneeProjectId) {
      this.assertSameProject(input.projectId, {
        projectId: input.assigneeProjectId,
      }, 'Assignee');
    }

    if (input.assigneeProjectId && input.assigneeIsActive === false) {
      throw new BadRequestException('Task assignee must be active');
    }
  }

  assertCompletedAt(status: TaskStatus, completedAt: Date | null): void {
    if (status === TaskStatus.DONE && !completedAt) {
      throw new BadRequestException('DONE tasks require completedAt');
    }

    if (status !== TaskStatus.DONE && completedAt) {
      throw new BadRequestException('Only DONE tasks may have completedAt');
    }
  }

  assertTaskStatus(status: TaskStatus): void {
    if (!Object.values(TaskStatus).includes(status)) {
      throw new BadRequestException(`Invalid task status: ${status}`);
    }
  }

  assertSprintTransition(current: SprintStatus, next: SprintStatus): void {
    if (current === next) {
      throw new BadRequestException(`Sprint is already ${current}`);
    }

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Invalid sprint transition: ${current} -> ${next}`,
      );
    }
  }

  assertSprintDates(startDate: Date | null, endDate: Date | null): void {
    if (endDate && !startDate) {
      throw new BadRequestException('Sprint endDate requires startDate');
    }

    if (startDate && endDate && endDate <= startDate) {
      throw new BadRequestException('Sprint endDate must be after startDate');
    }
  }
}