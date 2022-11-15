export interface Schema {
  [key: string]:
    | "string"
    | "string?"
    | "boolean"
    | "boolean?"
    | "number"
    | "number?"
    | Schema;
}

export interface Document {
  [key: string]: PossibleTypes | Document;
}

export type PossibleTypes = string | boolean | number | null;
