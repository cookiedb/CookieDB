import { bold, brightRed, rgb24 } from "../../deps.ts";

/**
 * Prints the ASCII CookieDB logo with a 16m gradient
 */
export function printLogo(gradient: boolean) {
  const logo = " \
  ,-----.              ,--.    ,--.       ,------.  ,-----.   \
  '  .--./ ,---.  ,---. |  |,-. `--' ,---. |  .-.  \\ |  |) /_  \
  |  |    | .-. || .-. ||     / ,--.| .-. :|  |  \\  :|  .-.  \\ \
  '  '--'\\' '-' '' '-' '|  \\  \\ |  |\\   --.|  '--'  /|  '--' / \
   `-----' `---'  `---' `--'`--'`--' `----'`-------' `------'";
  const green = Math.ceil(255 * Math.random());

  for (let y = 0; y < 5; y++) {
    const row = logo.slice(y * 63, (y + 1) * 63);
    let printRow = "";
    for (let x = 0; x < row.length; x++) {
      if (gradient) {
        printRow += rgb24(row[x], {
          r: 255 - (x * 4),
          g: green,
          b: 255 - (y * 51),
        });
      } else {
        printRow += row[x];
      }
    }
    console.log(bold(printRow));
  }
}

/**
 * Prints an error message to the console
 */
export function printError(message: string) {
  console.log(brightRed("error") + ": " + message);
}
