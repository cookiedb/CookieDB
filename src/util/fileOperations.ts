import { pack, unpack } from "msgpackr";

export function readFile(path: string): {
  documents: Record<string, any>;
  schema: Record<string, any> | null;
} {
  const fileBuffer = Deno.readFileSync(path);
  return unpack(fileBuffer);
}

export function writeFile(path: string, object: unknown) {
  Deno.writeFileSync(path, pack(object));
}
