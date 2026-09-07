// Shared file-filtering, prioritization, and digest-building logic for ingesting a whole
// codebase into the knowledge base — used by both the "link a GitHub repo" flow and the
// "upload a .zip of the codebase" flow (see src/App.tsx: fetchGithubRepoContent and
// handleFileUpload's zip branch), so a repo linked via GitHub and that same repo zipped and
// uploaded produce comparably-structured digests, and so the two ingestion paths don't
// independently drift on what counts as "worth reading."

export interface CodebaseFileEntry {
  path: string;
  content: string; // already-decoded text
}

// Directories whose contents are never useful context — build output, dependencies, VCS
// internals, IDE state. Matched as an exact path segment, not a substring, so e.g. a
// project directory named "distillery" isn't mistaken for "dist".
const SKIP_DIR_SEGMENTS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".nuxt", "out", "coverage",
  "vendor", ".venv", "venv", "env", "__pycache__", ".turbo", ".cache", "target",
  ".idea", ".vscode", ".pytest_cache", "bin", "obj",
]);

// Extensions worth reading as text context. Deliberately conservative — binary/asset/lock
// files are never useful as prose grounding and would just burn the character budget.
const TEXT_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "json", "md", "mdx", "txt", "py", "rb", "go",
  "rs", "java", "kt", "swift", "c", "h", "cpp", "hpp", "cs", "php", "sql", "yml", "yaml",
  "toml", "css", "scss", "less", "html", "graphql", "proto", "sh", "bash", "env",
  "gitignore", "editorconfig", "xml", "gradle", "cfg", "ini",
]);

// Filenames worth reading even without one of the extensions above (e.g. "Dockerfile" has
// none), and — doubling as the priority list below — the files most worth reading FIRST
// when a codebase is too large to include in full: README and manifest/config files tell
// an agent more about scope and stack per character than an arbitrary source file does.
const PRIORITY_FILENAMES = [
  "readme.md", "readme", "package.json", "pyproject.toml", "cargo.toml", "go.mod",
  "requirements.txt", "gemfile", "composer.json", "pom.xml", "build.gradle",
  ".env.example", "tsconfig.json", "docker-compose.yml", "dockerfile", "makefile",
];

const MAX_FILE_CHARS = 20000; // a single huge generated/vendored file shouldn't eat the whole budget
const MAX_FILES = 60;
const DEFAULT_TOTAL_CHAR_BUDGET = 150000;

function extensionOf(path: string): string {
  const base = path.split("/").pop() || "";
  if (["dockerfile", "makefile", "readme"].includes(base.toLowerCase())) return base.toLowerCase();
  const dot = base.lastIndexOf(".");
  return dot === -1 ? "" : base.slice(dot + 1).toLowerCase();
}

export function isLikelyIgnorablePath(path: string): boolean {
  const segments = path.split("/");
  if (segments.some(s => SKIP_DIR_SEGMENTS.has(s.toLowerCase()))) return true;
  if (/\.(lock|min\.js|min\.css|map|png|jpe?g|gif|webp|svg|ico|bmp|woff2?|ttf|eot|otf|mp4|mp3|wav|pdf|zip|tar|gz|7z|rar|exe|dll|so|dylib|class|jar|war|pyc|db|sqlite3?)$/i.test(path)) return true;
  return false;
}

export function isLikelyTextSourceFile(path: string): boolean {
  if (isLikelyIgnorablePath(path)) return false;
  const ext = extensionOf(path);
  return TEXT_EXTENSIONS.has(ext) || PRIORITY_FILENAMES.some(p => p === (path.split("/").pop() || "").toLowerCase());
}

/** Orders candidate paths so README/manifest/config files land first, then shallower paths
 *  (closer to the project root is usually more load-bearing than deeply nested detail),
 *  then alphabetically — a deterministic, sensible reading order for when the character
 *  budget runs out before every candidate file fits. */
export function prioritizeCodebasePaths(paths: string[]): string[] {
  const priorityIndex = (p: string) => {
    const base = p.split("/").pop()?.toLowerCase() || "";
    const idx = PRIORITY_FILENAMES.indexOf(base);
    return idx === -1 ? PRIORITY_FILENAMES.length : idx;
  };
  return [...paths].sort((a, b) => {
    const pa = priorityIndex(a);
    const pb = priorityIndex(b);
    if (pa !== pb) return pa - pb;
    const da = a.split("/").length;
    const db = b.split("/").length;
    if (da !== db) return da - db;
    return a.localeCompare(b);
  });
}

/** Builds one combined digest string from a codebase's file tree + selected file contents,
 *  bounded by a total character budget. Shared by the GitHub-link and zip-upload flows so
 *  both produce a comparably-structured result: a file-tree overview (so the reader/model
 *  knows the codebase's shape even for files whose content didn't make the cut) followed by
 *  the highest-priority files' actual content up to the budget. */
export function buildCodebaseDigest(opts: {
  sourceLabel: string; // e.g. "github.com/acme/widgets (branch: main)" or "widgets.zip"
  allPaths: string[]; // every path found (pre-filter), for the tree summary
  files: CodebaseFileEntry[]; // already-fetched/extracted text content, pre-filtered to likely source files
  totalCharBudget?: number;
}): string {
  const budget = opts.totalCharBudget ?? DEFAULT_TOTAL_CHAR_BUDGET;
  const parts: string[] = [];
  parts.push(`# Codebase: ${opts.sourceLabel}`);
  parts.push(`${opts.allPaths.length} total file(s) found in the tree.`);
  parts.push("");
  parts.push("## File tree (paths only — not every path below has its content included further down)");
  parts.push(opts.allPaths.slice(0, 500).join("\n"));
  if (opts.allPaths.length > 500) parts.push(`...and ${opts.allPaths.length - 500} more path(s) (omitted from this listing for length).`);
  parts.push("");
  parts.push("## File contents");

  const ordered = prioritizeCodebasePaths(opts.files.map(f => f.path)).slice(0, MAX_FILES);
  const byPath = new Map(opts.files.map(f => [f.path, f.content]));

  let used = parts.join("\n").length;
  let includedCount = 0;
  const contentBlocks: string[] = [];
  for (const path of ordered) {
    const content = byPath.get(path) || "";
    const trimmed = content.length > MAX_FILE_CHARS
      ? `${content.slice(0, MAX_FILE_CHARS)}\n...[truncated — ${content.length - MAX_FILE_CHARS} more characters omitted]`
      : content;
    const block = `\n--- FILE: ${path} ---\n${trimmed}\n--- END FILE ---\n`;
    if (used + block.length > budget) break;
    contentBlocks.push(block);
    used += block.length;
    includedCount++;
  }

  parts.push(...contentBlocks);
  parts.push(`\n[${includedCount} of ${opts.files.length} candidate text file(s) included above; the rest were omitted to stay within this knowledge source's context budget. The file tree above still lists every path found, even ones without included content.]`);
  return parts.join("\n");
}
