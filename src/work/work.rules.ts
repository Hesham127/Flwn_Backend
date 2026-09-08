import { BadRequestException, Injectable } from '@nestjs/common';

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ProjectScopedRecord {
  projectId: string;
}

const allowedTransitions: Readonly<Record<SprintStatus, readonly SprintStatus[]>> = {
  [SprintStatus.PLANNED]: [SprintStatus.ACTIVE, SprintStatus.CANCELLED],
  [SprintStatus.ACTIVE]: [SprintStatus.COMPLETED, SprintStatus.CANCELLED],
  [SprintStatus.COMPLETED]: [],
  [SprintStatus.CANCELLED]: [],
};

@Injectable()
export class WorkRulesService {
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