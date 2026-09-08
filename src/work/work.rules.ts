import { BadRequestException, Injectable } from '@nestjs/common';

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

const allowedTransitions: Readonly<Record<SprintStatus, readonly SprintStatus[]>> = {
  [SprintStatus.PLANNED]: [SprintStatus.ACTIVE, SprintStatus.CANCELLED],
  [SprintStatus.ACTIVE]: [SprintStatus.COMPLETED, SprintStatus.CANCELLED],
  [SprintStatus.COMPLETED]: [],
  [SprintStatus.CANCELLED]: [],
};

@Injectable()
export class WorkRulesService {
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