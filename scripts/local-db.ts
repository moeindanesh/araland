import { existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
const root = resolve(import.meta.dir, "..");
const directory = join(root, ".data", "postgres");
const candidates = [
  process.env.PG_BIN,
  "/Users/Shared/DBngin/postgresql/17.0/bin",
  "/opt/homebrew/opt/postgresql@17/bin",
  "/opt/homebrew/opt/postgresql@16/bin",
  "/usr/lib/postgresql/17/bin",
  "/usr/lib/postgresql/16/bin",
].filter(Boolean) as string[];
const bin = candidates.find((p) => existsSync(join(p, "pg_ctl")));
if (!bin) {
  console.error(
    "PostgreSQL tools were not found. Set PG_BIN, or use docker compose up -d postgres.",
  );
  process.exit(1);
}
async function run(command: string, args: string[], quiet = false) {
  const proc = Bun.spawn([join(bin!, command), ...args], {
    cwd: root,
    stdout: quiet ? "ignore" : "inherit",
    stderr: quiet ? "ignore" : "inherit",
  });
  return proc.exited;
}
const action = process.argv[2] || "start";
if (action === "stop") {
  if (existsSync(join(directory, "PG_VERSION")))
    process.exit(await run("pg_ctl", ["-D", directory, "stop", "-m", "fast"]));
  process.exit(0);
}
mkdirSync(join(root, ".data"), { recursive: true });
if (!existsSync(join(directory, "PG_VERSION"))) {
  if (
    await run("initdb", [
      "-D",
      directory,
      "-U",
      "araland",
      "-A",
      "trust",
      "--encoding=UTF8",
      "--locale=C",
    ])
  )
    process.exit(1);
}
if ((await run("pg_ctl", ["-D", directory, "status"], true)) === 0) {
  console.log("Araland PostgreSQL is already running on port 55432.");
  process.exit(0);
}
if (
  await run("pg_ctl", [
    "-D",
    directory,
    "-l",
    join(root, ".data", "postgres.log"),
    "-o",
    "-p 55432 -h 127.0.0.1",
    "start",
  ])
)
  process.exit(1);
const check = Bun.spawn(
  [
    join(bin, "psql"),
    "-h",
    "127.0.0.1",
    "-p",
    "55432",
    "-U",
    "araland",
    "-d",
    "postgres",
    "-tAc",
    "SELECT 1 FROM pg_database WHERE datname='araland'",
  ],
  { stdout: "pipe", stderr: "inherit" },
);
if ((await new Response(check.stdout).text()).trim() !== "1") {
  if (
    await run("createdb", [
      "-h",
      "127.0.0.1",
      "-p",
      "55432",
      "-U",
      "araland",
      "araland",
    ])
  )
    process.exit(1);
}
console.log(
  "Local development database ready: postgresql://araland@127.0.0.1:55432/araland",
);
