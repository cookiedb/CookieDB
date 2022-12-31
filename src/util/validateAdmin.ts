import { Config } from "./types.ts";

/**
 * Takes in a token and the current db configuration. Throws if user is not an admin
 */
export function validateAdmin(tenant: string, config: Config) {
  if (!config.admins.includes(tenant)) {
    throw "You are not an admin of this database";
  }
}
