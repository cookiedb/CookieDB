/**
 * All valid schema types
 */
export type SchemaTypes = "string" | "boolean" | "number" | "foreign_key";

/**
 * All valid schema keywords including types
 */
export type SchemaKeywords = SchemaTypes | "nullable" | "unique";

// I need to find a better way to do this :/
/**
 * All valid schema keys that can be assigned
 */
export type SchemaEntry =
  | SchemaTypes
  | `nullable ${SchemaTypes}`
  | `${SchemaTypes} nullable`
  | `unique ${SchemaTypes}`
  | `${SchemaTypes} unique`
  | `unique nullable ${SchemaTypes}`
  | `unique ${SchemaTypes} nullable`
  | `${SchemaTypes} unique nullable`
  | `nullable ${SchemaTypes} unique`
  | `${SchemaTypes} nullable unique`
  | `nullable unique ${SchemaTypes}`;

/**
 * Type definition for a Schema
 */
export interface Schema {
  [key: string]: SchemaEntry | Schema;
}

/**
 * Type definition for a document
 */
export interface Document {
  [key: string]: PossibleTypes | Document;
}

/**
 * Type definition for an alias
 */
export interface Alias {
  [key: string]: string | Alias;
}

/**
 * Valid types that may be in a document
 */
export type PossibleTypes = string | boolean | number | null;

/**
 * The type definition of a tenants's index
 * ```
 * {
 *  key_index: {
 *    'ex_key': 'chunk_name'
 *  },
 *  table_index: {
 *    'table_name': {
 *      'schema': null,
 *      'chunks': ['chunk_name'],
 *      'value_index': {
 *        'example_property': {
 *          'example_value': 'ex_key'
 *        }
 *      }
 *    }
 *  },
 *  chunk_index: {
 *    'chunk_name': 'table_name'
 *  }
 * }
 * ```
 */
export interface Meta {
  key_index: Record<string, string>;
  table_index: Record<string, {
    schema: Schema | null;
    chunks: string[];
    value_index: Record<string, Record<string, string>>;
  }>;
  chunk_index: Record<string, string>;
}

/**
 * The type definition of a chunk
 */
export type Chunk = Record<string, Document>;

/**
 * The type definition of the config file
 */
export interface Config {
  port: number;
  log: boolean;
  users: Record<string, string>;
  admins: string[];
  cert_file?: string;
  key_file?: string;
  advanced: {
    max_documents_per_chunk: number;
  };
}
