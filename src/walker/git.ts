import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type GitNumstatRow = {
  path: string;
  additions: number;
  deletions: number;
  commit: string;
  date: string;
};

export async function readRecentNumstat(rootPath: string): Promise<GitNumstatRow[]> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", "--numstat", "--since=3.months", "--date=short", "--pretty=format:commit:%H %ad", "HEAD"],
      { cwd: rootPath, maxBuffer: 10 * 1024 * 1024 },
    );
    return parseNumstat(stdout);
  } catch {
    return [];
  }
}

function parseNumstat(output: string): GitNumstatRow[] {
  const rows: GitNumstatRow[] = [];
  let currentCommit = "";
  let currentDate = "";

  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    if (line.startsWith("commit:")) {
      const [, commit = "", date = ""] = line.match(/^commit:([a-f0-9]+)\s+(\d{4}-\d{2}-\d{2})$/) ?? [];
      currentCommit = commit;
      currentDate = date;
      continue;
    }

    const [additionsRaw, deletionsRaw, filePath] = line.split("\t");
    if (!filePath || additionsRaw === "-" || deletionsRaw === "-") continue;
    rows.push({
      path: filePath,
      additions: Number(additionsRaw),
      deletions: Number(deletionsRaw),
      commit: currentCommit,
      date: currentDate,
    });
  }

  return rows;
}
