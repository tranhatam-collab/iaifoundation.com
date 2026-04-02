export function validateTenantScope(
  requestedTenantId: string,
  tokenTenantId: string,
): void {
  if (requestedTenantId !== tokenTenantId) {
    throw new Error('TENANT_SCOPE_MISMATCH');
  }
}

export function validateWorkspaceScope(
  requestedWorkspaceId: string,
  allowedWorkspaceIds: string[],
): void {
  if (!allowedWorkspaceIds.includes(requestedWorkspaceId)) {
    throw new Error('FORBIDDEN');
  }
}
