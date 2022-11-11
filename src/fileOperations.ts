import { unpack, pack } from 'https://deno.land/x/msgpackr@v1.7.0/index.js'

export function readFile(path: string) {
  const fileBuffer = Deno.readFileSync(path)
  return unpack(fileBuffer)
}

export function writeFile(path: string, object: unknown) {
  Deno.writeFileSync(path, pack(object))
}