// Overview
// read contents
// parse yaml
// collect `uses` and `${{ secrets.GITHUB_TOKEN }}` and `github.token`
// If found unknown use-case, put `permissions: write-all`
// Else if, put `permission: <combined permissions>`
import yaml from "yaml";
import * as fs from "fs/promises";
import path from "path";
import { validateGitHubActions } from "./types.validator";
import type { GhPermissionsDefinitions, GhPermissionValue, GhPermissions, GhPermissionTypes } from "./types";

export type UpdateGitHubActionsOptions = {
    verbose: boolean;
    // Apply the default permission when can not detect permissions
    defaultPermissions: "read-all" | "write-all";
    // TODO: implement force option
};
const getActionsPermissionsDefinitions = async (): Promise<GhPermissionsDefinitions> => {
    const yamlContent = await fs.readFile(path.join(__dirname, "../actions.yml"), "utf-8");
    const content = yaml.parse(yamlContent);
    return validateGitHubActions(content);
};

type GitHubActionSchema = {
    permissions?: GhPermissions;
    jobs?: {
        [jobName: string]: {
            permissions?: GhPermissions;
            steps: [
                {
                    name?: string;
                    uses?: string;
                    env?: {
                        [index: string]: string;
                    };
                }
            ];
        };
    };
};
type GitHubActionUses = [name: string, version: string];
export const collectUsesActions = (action: GitHubActionSchema): GitHubActionUses[] => {
    return Object.values(action.jobs ?? {}).flatMap((job) => {
        return job.steps
            .filter((step) => {
                return step.uses !== undefined;
            })
            .map((step) => {
                const [name, version] = step.uses!.split("@");
                return [name, version];
            });
    }) as GitHubActionUses[];
};
export const mergePermissions = (permissions: GhPermissions[]) => {
    const hasWriteAll = permissions.some((permission) => {
        return permission === "write-all";
    });
    if (hasWriteAll) {
        return "write-all";
    }
    const primitivePermissions = permissions.filter((permission) => {
        return typeof permission === "object";
    });
    const resultPermissions: GhPermissions = {};
    for (const permission of primitivePermissions) {
        (Object.entries(permission) as [keyof GhPermissionTypes, GhPermissionValue][]).forEach(
            ([permissionName, permissionValue]) => {
                if (permissionValue === "write") {
                    resultPermissions[permissionName] = "write";
                } else if (permissionValue === "read" && resultPermissions[permissionName] !== "write") {
                    resultPermissions[permissionName] = "read";
                } else if (resultPermissions[permissionName] === undefined) {
                    resultPermissions[permissionName] = "none";
                }
            }
        );
    }
    return resultPermissions;
};

export type YAMLString = string;
export const insertPermissions = (yamlString: YAMLString, permissions: GhPermissions): YAMLString => {
    const doc = yaml.parseDocument(yamlString);
    let result = yamlString;
    let stop = false;
    yaml.visit(doc, {
        Pair(_, pair) {
            if (stop) {
                return;
            }
            // @ts-expect-error: unknown
            // insert permissions before jobs
            if (pair.key.value === "jobs") {
                // @ts-ignore
                const startIndex: number = pair.key.range[0];
                const permissionString = yaml.stringify({
                    permissions
                });
                result = result.slice(0, startIndex) + `${permissionString}` + result.slice(startIndex);
                stop = true;
            }
        }
    });
    return result;
};
export const hasPermissions = (action: GitHubActionSchema): boolean => {
    if (action.permissions !== undefined) {
        return true;
    }
    return Object.values(action.jobs ?? {}).some((job) => {
        return job.permissions !== undefined;
    });
};
const secretGITHUB_TOKEN = /\${{\s*secrets.GITHUB_TOKEN\s*}}/;
type EnvEntry = [envName: string, envValue: string];
const getSecretEnvEntries = (content: GitHubActionSchema): EnvEntry[] => {
    return Object.values(content.jobs ?? {}).flatMap((job) => {
        return job.steps.flatMap((step) => {
            if (!step.env) {
                return [];
            }
            return Object.entries(step.env);
        });
    });
};
/**
 * It define special pattern mapping env name and permissions
 * @param envEntries
 */
const envToPermissions = (envEntries: EnvEntry[]): GhPermissions[] => {
    return envEntries.flatMap((entry) => {
        // npm special pattern
        // NODE_AUTH_TOKEN: ${{ secret.GITHUB_TOKEN }}
        if (entry[0] === "NODE_AUTH_TOKEN") {
            return [
                {
                    contents: "read",
                    packages: "write"
                }
            ];
        }
        return [];
    });
};
const hasSecretEnv = (envEntries: EnvEntry[]) => {
    return envEntries.some((envEntry) => {
        return secretGITHUB_TOKEN.test(envEntry[1]);
    });
};
export const computePermissions = async (
    content: GitHubActionSchema,
    options: UpdateGitHubActionsOptions
): Promise<GhPermissions> => {
    const definitions = await getActionsPermissionsDefinitions();
    const usesActions = collectUsesActions(content);
    const knownPermissions = usesActions.filter(([name]) => {
        return Object.prototype.hasOwnProperty.call(definitions, name);
    });
    // if found unknown actions, return default permissions
    if (knownPermissions.length !== usesActions.length) {
        if (options.verbose) {
            console.info(`found unknown actions, use ${options.defaultPermissions}`);
        }
        return options.defaultPermissions;
    }
    // if found usage for GITHUB_TOKEN in user script, return default permissions
    // Exception: NODE_AUTH_TOKEN
    const envEntries = getSecretEnvEntries(content);
    const permissionsFromEnvs = envToPermissions(envEntries);
    if (hasSecretEnv(envEntries) && permissionsFromEnvs.length !== envEntries.length) {
        if (options.verbose) {
            console.info(`found secrets.GITHUB_TOKEN usage, use ${options.defaultPermissions}`);
        }
        return options.defaultPermissions;
    }
    // if found usage of GITHUB_TOKEN, return default permissions
    const usedPermissions = knownPermissions.map(([name]) => {
        return Object.prototype.hasOwnProperty.call(definitions, name) && definitions[name]?.permissions;
    }) as GhPermissions[];
    const allPermissions = [...usedPermissions, ...permissionsFromEnvs];
    return mergePermissions(allPermissions);
};
/**
 * Update `permissions` on the yamlContent
 * @param yamlContent
 * @param options
 */
export const updateGitHubActions = async (
    yamlContent: string,
    options: UpdateGitHubActionsOptions
): Promise<string> => {
    const content = yaml.parse(yamlContent) as GitHubActionSchema;
    if (hasPermissions(content)) {
        return yamlContent;
    }
    const requiresPermissions = await computePermissions(content, options);
    return insertPermissions(yamlContent, requiresPermissions);
};
