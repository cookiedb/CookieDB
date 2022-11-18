import { ensureDirSync, pack, resolve, unpack } from "../../deps.ts";
import { Chunk, Meta } from "./types.ts";

export function readChunk(
  directory: string,
  tenant: string,
  chunkName: string,
): Chunk {
  const chunkPath = resolve(directory, "users", tenant, `${chunkName}.ck`);
  try {
    const fileBuffer = Deno.readFileSync(chunkPath);
    return unpack(fileBuffer);
  } catch (_err) {
    throw "Chunk does not exist";
  }
}

export function writeChunk(
  directory: string,
  tenant: string,
  chunkName: string,
  chunk: Chunk,
) {
  const chunkPath = resolve(directory, "users", tenant, `${chunkName}.ck`);
  Deno.writeFileSync(chunkPath, pack(chunk));
}

export function deleteChunk(
  directory: string,
  tenant: string,
  chunkName: string,
) {
  const chunkPath = resolve(directory, "users", tenant, `${chunkName}.ck`);
  Deno.remove(chunkPath);
}

export function readMeta(directory: string, tenant: string): Meta {
  const metaPath = resolve(directory, "users", tenant, "__meta__.ck");
  try {
    const fileBuffer = Deno.readFileSync(metaPath);
    return unpack(fileBuffer);
  } catch (_err) {
    throw "Meta does not exist";
  }
}

export function writeMeta(directory: string, tenant: string, meta: Meta) {
  const metaPath = resolve(directory, "users", tenant, "__meta__.ck");
  Deno.writeFileSync(metaPath, pack(meta));
}

export function ensureTenant(directory: string, tenant: string) {
  // Make sure tenant exists
  ensureDirSync(resolve(directory, "users", tenant));

  // Make metadata file if not exists
  const metaPath = resolve(directory, "users", tenant, "__meta__.ck");
  try {
    Deno.lstatSync(metaPath);
  } catch (_err) {
    writeMeta(directory, tenant, {
      key_index: {},
      table_index: {},
      chunk_index: {},
    });
  }
}
