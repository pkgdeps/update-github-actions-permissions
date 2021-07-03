export type GhPermissionValue = "none" | "read" | "write";
export type GhPermissionTypes = {
    actions?: GhPermissionValue;
    checks?: GhPermissionValue;
    contents?: GhPermissionValue;
    "pull-requests"?: GhPermissionValue;
    deployments?: GhPermissionValue;
    issues?: GhPermissionValue;
    packages?: GhPermissionValue;
    "repository-projects"?: GhPermissionValue;
    "security-events"?: GhPermissionValue;
    statuses?: GhPermissionValue;
};
export type GhPermissions = "read-all" | "write-all" | GhPermissionTypes;
export type GhPermissionsDefinition = {
    permissions: GhPermissions;
};

export type GhPermissionsDefinitions = {
    [actionName: string]: GhPermissionsDefinition | null;
};
