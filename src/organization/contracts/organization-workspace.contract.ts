export type OrganizationLookup = {
  id: string;
  name: string;
  description?: string | null;
};

export type WorkspaceLookup = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
};

export interface OrganizationWorkspaceLookupContract {
  getOrganization(id: string): Promise<OrganizationLookup>;

  getWorkspace(
    organizationId: string,
    workspaceId: string,
  ): Promise<WorkspaceLookup>;

  assertWorkspaceInOrganization(
    organizationId: string,
    workspaceId: string,
  ): Promise<WorkspaceLookup>;
}