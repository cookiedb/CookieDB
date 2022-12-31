import { parse } from "./deps.ts";
import { resolve } from "./deps.ts";
import { printError, printLogo } from "./src/util/print.ts";
import { createUser, init, start } from "./mod.ts";

const command = parse(Deno.args, {
  boolean: ["no-fun", "admin"],
  string: ["username", "token"],
});

function run(cmd: typeof command) {
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
      printLogo(!cmd["no-fun"]);
      init(dir);
      return;
    }

    case "start": {
      let dir = resolve("./");
      if (cmd._.length === 2 && typeof cmd._[1] === "string") {
        dir = resolve(cmd._[1]);
      }
      printLogo(!cmd["no-fun"]);
      start(dir);
      return;
    }

    case "help": {
      printLogo(!cmd["no-fun"]);
      console.log(
        "Welcome to CookieDB, to get started please check out our github: https://github.com/cookiedb/CookieDB\n",
      );
      console.log("Commands:");
      console.log("- help: show this screen (`cookie help`)");
      console.log(
        "- init: initialize a database within a specific directory (`cookie init ./test`)",
      );
      console.log(
        "- create_user: generate a user account for the database (`cookie create_user ./test --username=admin`)",
      );
      console.log("- start: start the database (`cookie start ./test`)");

      console.log("\nFlags:");
      console.log("--no-fun: turns off the gradient logo");

      return;
    }

    case "create_user": {
      let dir = resolve("./");
      if (cmd._.length === 2 && typeof cmd._[1] === "string") {
        dir = resolve(cmd._[1]);
      }
      printLogo(cmd["no-fun"] ? false : true);
      const { username, token } = createUser(dir, {
        username: cmd.username,
        token: cmd.token,
        admin: cmd.admin,
      });
      console.log(
        `Created ${
          cmd.admin ? "admin" : "user"
        } "${username}" with bearer token "${token}"`,
      );
      return;
    }

    default:
      printError("Unrecognized command, type `cookie help`");
  }
}

run(command);
