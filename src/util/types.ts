export type SchemaTypes = "string" | "boolean" | "number" | "foreign_key";

export type SchemaKeywords = SchemaTypes | "nullable" | "unique";

// I need to find a better way to do this :/
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

export interface Schema {
  [key: string]: SchemaEntry | Schema;
}

export interface Document {
  [key: string]: PossibleTypes | Document;
}

export interface Alias {
  [key: string]: string | Alias;
}

export type PossibleTypes = string | boolean | number | null;

export interface Meta {
  key_index: Record<string, [string, string]>;
  row_index: Record<string, Record<string, string>>;
  table_index: Record<string, {
    schema: Schema | null;
    chunks: string[];
  }>;
}

export type Chunk = Record<string, Document>;

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
