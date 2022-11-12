import { pack, unpack } from "msgpackr";
import { ensureDirSync } from "std/fs/mod.ts";
import { resolve } from "std/path/mod.ts";

export function readFile(path: string) {
  const fileBuffer = Deno.readFileSync(path);
  return unpack(fileBuffer);
}

export function writeFile(path: string, object: unknown) {
  Deno.writeFileSync(path, pack(object));
}

export function ensureTenant(directory: string, tenant: string) {
  // Make sure tenant exists
  ensureDirSync(resolve(directory, tenant));

  // Make metadata file if not exists
  const metaPath = resolve(directory, tenant, "__meta__.ck");
  try {
    Deno.lstatSync(metaPath);
  } catch (_err) {
    writeFile(metaPath, {
      foreign_key_index: { // key -> table pair
      },
    });
  }
}
