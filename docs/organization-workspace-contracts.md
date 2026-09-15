# Organization / Workspace Handoff

- Workspace belongs to one Organization.
- Workspace creation requires an existing Organization.
- organizationId cannot be changed after Workspace creation.
- Workspace lookups must be scoped by organizationId.
- Cross-organization references return WORKSPACE_NOT_FOUND.
- Archived Organizations and Workspaces are excluded from normal lookups.

# Error codes:
ORGANIZATION_NOT_FOUND
WORKSPACE_NOT_FOUND

# Use 
OrganizationWorkspaceLookupService for Organization/Workspace validation.

