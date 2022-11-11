import { rgb24, red } from "std/fmt/colors.ts";

export function printGradientLogo() {
  const logo = " \
  ,-----.              ,--.    ,--.       ,------.  ,-----.   \
  '  .--./ ,---.  ,---. |  |,-. `--' ,---. |  .-.  \\ |  |) /_  \
  |  |    | .-. || .-. ||     / ,--.| .-. :|  |  \\  :|  .-.  \\ \
  '  '--'\\' '-' '' '-' '|  \\  \\ |  |\\   --.|  '--'  /|  '--' / \
   `-----' `---'  `---' `--'`--'`--' `----'`-------' `------'"
  const green = Math.ceil(255*Math.random())
  
  for(let y = 0; y < 5; y++) {
    const row = logo.slice(y * 63, (y+1) * 63)
    let printRow = ""
    for(let x = 0; x < row.length; x++) {
      printRow += rgb24(row[x], {r: 255 - (x*4), g: green, b: 255 - (y*51)})
    }
    console.log(printRow)
  }
}

export function printError(message: string) {
  console.log(red("error") + ": "+ message)
}