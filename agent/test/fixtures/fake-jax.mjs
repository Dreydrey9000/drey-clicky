#!/usr/bin/env node
import fs from "node:fs";
import { spawn } from "node:child_process";
import { Socket } from "node:net";
const args = process.argv.slice(2);
let input = "";
for await (const chunk of process.stdin) input += chunk;
if (process.env.FAKE_JAX_RECEIPT) fs.writeFileSync(process.env.FAKE_JAX_RECEIPT, JSON.stringify({ args, input, pid: process.pid }));
if (input.includes('"hang-tree"')) {
  const descendant = spawn(process.execPath, ["-e", "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"], { stdio: "ignore" });
  if (process.env.FAKE_JAX_RECEIPT) fs.writeFileSync(process.env.FAKE_JAX_RECEIPT, JSON.stringify({ args, input, pid: process.pid, descendant: descendant.pid }));
  setInterval(() => {}, 1000);
}
else if (input.includes('"hang"')) { setInterval(() => {}, 1000); }
else if (input.includes('"fail"')) { process.stderr.write("private-diagnostic-must-not-leak"); process.exit(3); }
else if (input.includes('"approval-task"')) {
  const channel = new Socket({ fd: 3, readable: true, writable: true });
  channel.setEncoding("utf8");
  channel.write(JSON.stringify({ id: "46c06450-6f98-47bc-bb0a-e75e30386488", kind: "computer_use", summary: "Open Calculator", details: '{"app":"Calculator"}' }) + "\n");
  await new Promise(resolve => channel.once("data", resolve));
  channel.end();
  process.stdout.write("Everything is done.");
}
else if (input.includes('"warning"')) process.stdout.write("Warning: Unknown toolsets: example-old-tool\nYour draft is ready.");
else if (input.includes('"create-artifact"')) { fs.writeFileSync("created-by-jax.txt", "verified\n"); process.stdout.write("The file is ready."); }
else if (input.includes('"point-fixture"')) process.stdout.write("[POINT:128,128:red square] The red square is here.");
else process.stdout.write("Your draft is ready.\n\n" + "Details for the answer card. ".repeat(20));
