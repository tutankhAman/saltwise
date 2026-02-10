import { write } from "bun";

const TASKS = [
  { path: "packages/db/.env", name: "Database Package" },
  { path: "apps/web/.env", name: "Web App" },
];

console.log("\nEnvironment Setup\n");
console.log(
  "This script will set up environment variables for your applications."
);
console.log("It will create .env files in packages/db and apps/web.\n");

// biome-ignore lint/suspicious/noAlert: CLI script
const dbUrl = prompt("Enter your DATABASE_URL:");

if (!dbUrl?.trim()) {
  console.error("Error: DATABASE_URL cannot be empty.");
  process.exit(1);
}

// biome-ignore lint/suspicious/noAlert: CLI script
const supabaseUrl = prompt("Enter your NEXT_PUBLIC_SUPABASE_URL:");

if (!supabaseUrl?.trim()) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL cannot be empty.");
  process.exit(1);
}

// biome-ignore lint/suspicious/noAlert: CLI script
const supabaseAnonKey = prompt("Enter your NEXT_PUBLIC_SUPABASE_ANON_KEY:");

if (!supabaseAnonKey?.trim()) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty.");
  process.exit(1);
}

const dbContent = `DATABASE_URL="${dbUrl.trim()}"\n`;
const webContent = `DATABASE_URL="${dbUrl.trim()}"
NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl.trim()}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey.trim()}"
`;

console.log("\n");

for (const task of TASKS) {
  try {
    const content = task.path.includes("apps/web") ? webContent : dbContent;
    await write(task.path, content);
    console.log(`Wrote to ${task.name} (${task.path})`);
  } catch (error) {
    console.error(`Failed to write to ${task.name}:`, error);
  }
}

console.log("\n Setup complete! You can now run 'bun dev'.\n");
