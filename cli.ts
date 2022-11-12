import { parse } from "std/flags/mod.ts";
import { ensureDirSync } from "std/fs/mod.ts";
import { resolve } from "std/path/mod.ts";
import { printError, printLogo } from "@/util/print.ts";
import { start, init } from "./mod.ts";

const command = parse(Deno.args);

function run(cmd: {
  [x: string]: any;
  _: (string | number)[];
}) {
  if (cmd._.length === 0) {
    return printError("No arguments provided, try `cookie help`");
  }

  if (cmd._[0] === "init") {
    if (cmd._.length < 2) return printError("No directory specified");
    if (typeof cmd._[1] !== "string") {
      return printError("Directory is not valid");
    }
    const dir = resolve(cmd._[1]);
    printLogo(cmd["no-fun"] ? false : true);
    init(dir)
    return;
  }

  if (cmd._[0] === "start") {
    let dir = resolve("./");
    if (cmd._.length === 2 && typeof cmd._[1] === "string") {
      dir = resolve(cmd._[1]);
    }
    printLogo(cmd["no-fun"] ? false : true);
    start(dir);
    return;
  }

  printError("Unrecognized command, type `cookie help`");
}

run(command);
