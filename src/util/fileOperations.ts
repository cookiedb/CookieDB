import { ensureDirSync, resolve } from "../../deps.ts";
import { Chunk, Meta } from "./types.ts";

/**
 * Given a chunk this locates and reads the chunk into memory
 */
export function readChunk(
  directory: string,
  tenant: string,
  chunkName: string,
): Chunk {
  const chunkPath = resolve(directory, "users", tenant, `${chunkName}.ck`);
  try {
    const fileBuffer = Deno.readTextFileSync(chunkPath);
    return JSON.parse(fileBuffer);
  } catch (_err) {
    throw "Chunk does not exist";
  }
}

/**
 * Given a chunk and contents this locates and writes the chunk to disk
 */
export function writeChunk(
  directory: string,
  tenant: string,
  chunkName: string,
  chunk: Chunk,
) {
  const chunkPath = resolve(directory, "users", tenant, `${chunkName}.ck`);
  Deno.writeTextFileSync(chunkPath, JSON.stringify(chunk));
}

/**
 * Given a chunk this removes a chunk from the disk
 */
export function deleteChunk(
  directory: string,
  tenant: string,
  chunkName: string,
) {
  const chunkPath = resolve(directory, "users", tenant, `${chunkName}.ck`);
  Deno.remove(chunkPath);
}

/**
 * Given a user this reads the user's index into memory
 */
export function readMeta(directory: string, tenant: string): Meta {
  const metaPath = resolve(directory, "users", tenant, "__meta__.ck");
  try {
    const fileBuffer = Deno.readTextFileSync(metaPath);
    return JSON.parse(fileBuffer);
  } catch (_err) {
    throw "Meta does not exist";
  }
}

/**
 * Given a user and content this writes a users index to disk
 */
export function writeMeta(directory: string, tenant: string, meta: Meta) {
  const metaPath = resolve(directory, "users", tenant, "__meta__.ck");
  Deno.writeTextFileSync(metaPath, JSON.stringify(meta));
}

/**
 * Creates all of the directories that would be read/written to avoid errors in those cases.
 * Technically a TOCTOA violation but this would be quite rare.
 */
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
      row_index: {},
      table_index: {},
    });
  }
}

/**
 * Given a tenant this will remove all information on disk about them
 */
export function deleteTenant(directory: string, tenant: string) {
  try {
    Deno.removeSync(resolve(directory, "users", tenant), {
      recursive: true,
    });
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return; // ignore these errors
    }
    throw err;
  }
}
