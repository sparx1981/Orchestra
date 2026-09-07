import { describe, it, expect } from "vitest";
import {
  isLikelyIgnorablePath,
  isLikelyTextSourceFile,
  prioritizeCodebasePaths,
  buildCodebaseDigest,
} from "../codebaseIngest";

describe("isLikelyIgnorablePath", () => {
  it("skips known dependency/build/VCS directories", () => {
    expect(isLikelyIgnorablePath("node_modules/react/index.js")).toBe(true);
    expect(isLikelyIgnorablePath(".git/HEAD")).toBe(true);
    expect(isLikelyIgnorablePath("dist/bundle.js")).toBe(true);
    expect(isLikelyIgnorablePath("src/components/dist-report.ts")).toBe(false); // "dist" as a substring of a filename, not a directory segment
  });

  it("skips binary/lock/asset extensions", () => {
    expect(isLikelyIgnorablePath("package-lock.lock")).toBe(true);
    expect(isLikelyIgnorablePath("assets/logo.png")).toBe(true);
    expect(isLikelyIgnorablePath("bundle.min.js")).toBe(true);
  });

  it("does not flag ordinary source files", () => {
    expect(isLikelyIgnorablePath("src/App.tsx")).toBe(false);
    expect(isLikelyIgnorablePath("README.md")).toBe(false);
  });
});

describe("isLikelyTextSourceFile", () => {
  it("accepts common source and config extensions", () => {
    expect(isLikelyTextSourceFile("src/index.ts")).toBe(true);
    expect(isLikelyTextSourceFile("main.py")).toBe(true);
    expect(isLikelyTextSourceFile("config.yml")).toBe(true);
  });

  it("accepts extensionless priority filenames like Dockerfile", () => {
    expect(isLikelyTextSourceFile("Dockerfile")).toBe(true);
    expect(isLikelyTextSourceFile("backend/Dockerfile")).toBe(true);
  });

  it("rejects ignorable paths and unknown binary extensions", () => {
    expect(isLikelyTextSourceFile("node_modules/foo/index.js")).toBe(false);
    expect(isLikelyTextSourceFile("photo.png")).toBe(false);
    expect(isLikelyTextSourceFile("archive.zip")).toBe(false);
  });
});

describe("prioritizeCodebasePaths", () => {
  it("puts README and manifest files first, then shallower paths, then alphabetical", () => {
    const paths = [
      "src/deep/nested/file.ts",
      "src/index.ts",
      "package.json",
      "README.md",
      "src/App.tsx",
    ];
    const ordered = prioritizeCodebasePaths(paths);
    expect(ordered[0]).toBe("README.md");
    expect(ordered[1]).toBe("package.json");
    // Both remaining "src/" files are shallower than the deeply nested one
    expect(ordered.indexOf("src/deep/nested/file.ts")).toBe(ordered.length - 1);
  });

  it("does not mutate the input array", () => {
    const paths = ["b.ts", "a.ts"];
    const copy = [...paths];
    prioritizeCodebasePaths(paths);
    expect(paths).toEqual(copy);
  });
});

describe("buildCodebaseDigest", () => {
  it("includes the source label, file tree, and file contents", () => {
    const digest = buildCodebaseDigest({
      sourceLabel: "github.com/acme/widgets (branch: main)",
      allPaths: ["README.md", "src/index.ts"],
      files: [
        { path: "README.md", content: "# Widgets\nA widget factory." },
        { path: "src/index.ts", content: "export const widget = 1;" },
      ],
    });
    expect(digest).toContain("github.com/acme/widgets (branch: main)");
    expect(digest).toContain("README.md");
    expect(digest).toContain("A widget factory.");
    expect(digest).toContain("export const widget = 1;");
    expect(digest).toContain("2 of 2 candidate text file(s) included");
  });

  it("respects the total character budget and reports how many files were omitted", () => {
    const files = Array.from({ length: 10 }, (_, i) => ({
      path: `src/file${i}.ts`,
      content: "x".repeat(5000),
    }));
    const digest = buildCodebaseDigest({
      sourceLabel: "test.zip",
      allPaths: files.map(f => f.path),
      files,
      totalCharBudget: 12000,
    });
    // Well under all 10 files' worth of content (50k chars) actually landing in the digest
    expect(digest.length).toBeLessThan(20000);
    expect(digest).toMatch(/\d+ of 10 candidate text file\(s\) included/);
    const includedMatch = digest.match(/(\d+) of 10 candidate text file\(s\) included/);
    expect(Number(includedMatch![1])).toBeLessThan(10);
  });

  it("still lists every path in the tree even when most have no content included", () => {
    const digest = buildCodebaseDigest({
      sourceLabel: "test.zip",
      allPaths: ["a.png", "b.ts", "c.ts"],
      files: [{ path: "b.ts", content: "content" }],
    });
    expect(digest).toContain("a.png");
    expect(digest).toContain("3 total file(s) found");
  });

  it("truncates an individual oversized file rather than letting it eat the whole budget", () => {
    const digest = buildCodebaseDigest({
      sourceLabel: "test.zip",
      allPaths: ["huge.ts"],
      files: [{ path: "huge.ts", content: "y".repeat(30000) }],
    });
    expect(digest).toContain("[truncated");
  });

  it("handles an empty codebase without throwing", () => {
    const digest = buildCodebaseDigest({ sourceLabel: "empty.zip", allPaths: [], files: [] });
    expect(digest).toContain("0 total file(s) found");
    expect(digest).toContain("0 of 0 candidate text file(s) included");
  });
});
