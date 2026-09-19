import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';
import { OrganizationWorkspaceLookupService } from './organization-workspace-lookup.service.js';

@Module({
  imports: [OrganizationModule, WorkspaceModule],
  providers: [OrganizationWorkspaceLookupService],
  exports: [OrganizationWorkspaceLookupService],
})
export class OrganizationWorkspaceLookupModule {}
