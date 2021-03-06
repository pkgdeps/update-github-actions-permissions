import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";
// transform function
import { updateGitHubActions, UpdateGitHubActionsOptions } from "../src/index";

const fixturesDir = path.join(__dirname, "snapshots");
describe("Snapshot testing", () => {
    fs.readdirSync(fixturesDir).map((caseName) => {
        const normalizedTestName = caseName.replace(/-/g, " ");
        it(`Test ${normalizedTestName}`, async function () {
            const fixtureDir = path.join(fixturesDir, caseName);
            const actualFilePath = path.join(fixtureDir, "input.yml");
            const actualContent = fs.readFileSync(actualFilePath, "utf-8");
            const actualOptionFilePath = path.join(fixtureDir, "options.json");
            const actualOptions: UpdateGitHubActionsOptions = fs.existsSync(actualOptionFilePath)
                ? JSON.parse(fs.readFileSync(actualOptionFilePath, "utf-8"))
                : { defaultPermissions: "write-all" };
            const actual = await updateGitHubActions(actualContent, actualOptions);
            const expectedFilePath = path.join(fixtureDir, "output.yml");
            // Usage: update snapshots
            // UPDATE_SNAPSHOT=1 npm test
            if (!fs.existsSync(expectedFilePath) || process.env.UPDATE_SNAPSHOT) {
                fs.writeFileSync(expectedFilePath, actual);
                this.skip(); // skip when updating snapshots
                return;
            }
            // compare input and output
            const expectedContent = fs.readFileSync(expectedFilePath, "utf-8");
            assert.deepStrictEqual(
                actual,
                expectedContent,
                `
${fixtureDir}
${actual}
`
            );
        });
    });
});
