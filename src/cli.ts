import meow from "meow";
import * as fs from "fs/promises";
import { updateGitHubActions } from "./index";

export const cli = meow(
    `
    Usage
      $ update-github-actions-permissions [file|glob]
 
    Options
      --defaultPermissions                [String] "write-all" or "read-all". Default: "write-all"
 
    Examples
      $ update-github-actions-permissions .github/workflows/test.yml
      # multiple inputs
      $ update-github-actions-permissions .github/workflows/test.yml .github/workflows/publish.yml 
      $ update-github-actions-permissions .github/workflows/*.yml # in bash
`,
    {
        flags: {
            defaultPermissions: {
                type: "string",
                default: "write-all"
            }
        },
        autoHelp: true,
        autoVersion: true
    }
);

const defaultPermissions = (permission: string): "write-all" | "read-all" => {
    if (permission === "write-all" || permission === "read-all") {
        return permission;
    }
    throw new Error(`Unknown permisssions: ${permission}`);
};
export const run = async (
    input = cli.input,
    flags = cli.flags
): Promise<{ exitStatus: number; stdout: string | null; stderr: Error | null }> => {
    for (const filePath of input) {
        const yamlContent = await fs.readFile(filePath, "utf-8");
        const updatedContent = await updateGitHubActions(yamlContent, {
            defaultPermissions: defaultPermissions(flags.defaultPermissions)
        });
        if (yamlContent !== updatedContent) {
            await fs.writeFile(filePath, updatedContent, "utf-8");
        }
    }
    return {
        stdout: null,
        stderr: null,
        exitStatus: 0
    };
};
