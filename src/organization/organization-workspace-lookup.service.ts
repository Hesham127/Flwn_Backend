import { Injectable } from '@nestjs/common';

import {
  OrganizationLookup,
  OrganizationWorkspaceLookupContract,
  WorkspaceLookup,
} from './contracts/organization-workspace.contract.js';

import { OrganizationService } from './organization.service.js';
import { WorkspaceService } from './workspace.service.js';

@Injectable()
export class OrganizationWorkspaceLookupService
  implements OrganizationWorkspaceLookupContract
{
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async getOrganization(
    id: string,
  ): Promise<OrganizationLookup> {
    return this.organizationService.findOne(id);
  }

  async getWorkspace(
    organizationId: string,
    workspaceId: string,
  ): Promise<WorkspaceLookup> {
    return this.workspaceService.findOne(
      organizationId,
      workspaceId,
    );
  }

  async assertWorkspaceInOrganization(
    organizationId: string,
    workspaceId: string,
  ): Promise<WorkspaceLookup> {
    return this.workspaceService.findOne(
      organizationId,
      workspaceId,
    );
  }
}