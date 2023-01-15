import { mergePermissions } from "../src/index.js";
import assert from "assert";

describe("mergePermissions", function () {
    it("should merge permissions: write > read", () => {
        const permissions = mergePermissions([{ contents: "read" }, { contents: "write" }]);
        assert.deepStrictEqual(permissions, {
            contents: "write"
        });
    });
    it("should merge permissions: read > none", () => {
        const permissions = mergePermissions([{ contents: "read" }, { contents: "none" }]);
        assert.deepStrictEqual(permissions, {
            contents: "read"
        });
    });
    it("should merge permissions when complex", () => {
        const permissions = mergePermissions([
            { contents: "write", "pull-requests": "write" },
            { contents: "none", "pull-requests": "read" },
            { packages: "write" },
            { contents: "none" },
            { issues: "read" }
        ]);
        assert.deepStrictEqual(permissions, {
            contents: "write",
            packages: "write",
            issues: "read",
            "pull-requests": "write"
        });
    });
});
