import { parse } from "./deps.ts";
import { resolve } from "./deps.ts";
import { printError, printLogo } from "./src/util/print.ts";
import { createUser, init, start } from "./mod.ts";

const command = parse(Deno.args);

function run(cmd: {
  [x: string]: any;
  _: (string | number)[];
}) {
  if (cmd._.length === 0) {
    return printError("No arguments provided, try `cookie help`");
  }

  switch (cmd._[0]) {
    case "init": {
      if (cmd._.length < 2) return printError("No directory specified");
      if (typeof cmd._[1] !== "string") {
        return printError("Directory is not valid");
      }
      const dir = resolve(cmd._[1]);
      printLogo(cmd["no-fun"] ? false : true);
      init(dir);
      return;
    }

    case "start": {
      let dir = resolve("./");
      if (cmd._.length === 2 && typeof cmd._[1] === "string") {
        dir = resolve(cmd._[1]);
      }
      printLogo(cmd["no-fun"] ? false : true);
      start(dir);
      return;
    }

    case "help": {
      printLogo(cmd["no-fun"] ? false : true);
      console.log(
        "Welcome to CookieDB, to get started please check out our github: https://github.com/cookiedb/CookieDB\n",
      );
      console.log("Commands:");
      console.log("- help: show this screen (`cookie help`)");
      console.log(
        "- init: initialize a database within a specific directory (`cookie init ./test`)",
      );
      console.log(
        "- make_user: generate a user account for the database (`cookie make_user ./test --name=admin`)",
      );
      console.log("- start: start the database (`cookie start ./test`)");

      console.log("\nFlags:");
      console.log("--no-fun: turns off the gradient logo");

      return;
    }

    case "make_user": {
      let dir = resolve("./");
      if (cmd._.length === 2 && typeof cmd._[1] === "string") {
        dir = resolve(cmd._[1]);
      }
      printLogo(cmd["no-fun"] ? false : true);
      const { name, auth } = createUser(dir, {
        name: cmd.name,
        auth: cmd.auth,
      });
      console.log(`Created user "${name}" with bearer token "${auth}"`);
      return;
    }

    default:
      printError("Unrecognized command, type `cookie help`");
  }
}

run(command);
