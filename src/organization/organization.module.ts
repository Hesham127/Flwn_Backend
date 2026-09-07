import { Module } from '@nestjs/common';

import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { WorkspaceController } from './workspace.controller.js';
import { WorkspaceService } from './workspace.service.js';
import { OrganizationWorkspaceLookupService } from './organization-workspace-lookup.service.js';

@Module({
  controllers: [
    OrganizationController,
    WorkspaceController,
  ],
  providers: [
    OrganizationService,
    WorkspaceService,
    OrganizationWorkspaceLookupService,
  ],
  exports: [
    OrganizationService,
    WorkspaceService,
    OrganizationWorkspaceLookupService,
  ],
})
export class OrganizationModule {}
