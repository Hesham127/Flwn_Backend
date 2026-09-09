import { Injectable } from '@nestjs/common';
import type { ProjectMemberRecord } from '../work/work.rules.js';

export interface OrganizationMembershipLookup {
  findProjectMember(
    projectId: string,
    memberId: string,
  ): Promise<ProjectMemberRecord | null>;
}

@Injectable()
export class OrganizationMembershipService implements OrganizationMembershipLookup {
  private readonly memberships = new Map<string, ProjectMemberRecord>();

  async findProjectMember(
    projectId: string,
    memberId: string,
  ): Promise<ProjectMemberRecord | null> {
    return this.memberships.get(`${projectId}:${memberId}`) ?? null;
  }

  addProjectMember(
    projectId: string,
    memberId: string,
    status: ProjectMemberRecord['status'] = 'ACTIVE',
  ): void {
    this.memberships.set(`${projectId}:${memberId}`, { projectId, status });
  }
}