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

## Module ownership

- `OrganizationModule` owns organization controllers, services, DTOs, and errors, and exports `OrganizationService`.
- `WorkspaceModule` owns workspace controllers, services, DTOs, and errors. It imports `OrganizationModule` for parent validation and exports `WorkspaceService`.
- `OrganizationWorkspaceLookupModule` owns `OrganizationWorkspaceLookupService` and its contract under `src/organization-workspace-lookup/`. It imports both feature modules and exports the lookup service.
- Consumers of cross-feature validation import `OrganizationWorkspaceLookupModule` and inject `OrganizationWorkspaceLookupService`.

## Persistence

Both feature services use the Prisma 7 client from `src/prisma/db.ts`, generated under `src/generated/prisma/` and initialized with `PrismaPg`. Queries use `db.organization` and `db.workspace` delegates. Database configuration lives in `prisma.config.ts`.

## Tests

- `test/unit/organization/` and `test/unit/workspace/`: isolated feature controller and service tests.
- `test/unit/app/`: application controller unit tests.
- `test/integration/`: cross-module tests using real Nest module imports with mocked Prisma delegates.
- `test/e2e/`: full application HTTP tests.

Run `npm test` for unit and integration tests, and `npm run test:e2e` for application tests. The existing e2e smoke test loads the real Prisma client and requires `DATABASE_URL`, but does not query the database.

