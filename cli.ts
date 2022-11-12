import { parse } from "std/flags/mod.ts";
import { ensureDir } from "std/fs/mod.ts"
import { resolve } from "std/path/mod.ts"
import { printError, printLogo } from "./src/print.ts";
import config from "./src/config.json" assert { type: "json" };
import start from "./src/start.ts";

const command = parse(Deno.args);

function run(cmd: {
  [x: string]: any;
  _: (string | number)[];
}) {
  if (cmd._.length === 0) return printError("No arguments provided, try `cookie help`")
  
  if(cmd._[0] === "init") {
    if(cmd._.length < 2) return printError("No directory specified")
    if(typeof cmd._[1] !== "string") return printError("Directory is not valid")
    const dir = resolve(cmd._[1])
    printLogo(cmd["no-fun"] ? false: true)
    console.log("Making directory...")
    ensureDir(dir)
    console.log("Made directory")
    console.log("Generating config...")
    Deno.writeTextFileSync(resolve(cmd._[1], 'config.json'), JSON.stringify(config, null, 2))
    console.log("Generated config")
    return
  }

  if(cmd._[0] === "start") {
    let dir = resolve("./")
    if(cmd._.length === 2 && typeof cmd._[1] === "string") dir = resolve(cmd._[1])
    printLogo(cmd["no-fun"] ? false: true)
    start(dir)
    return
  }

  printError("Unrecognized command, type `cookie help`")
}

run(command);
