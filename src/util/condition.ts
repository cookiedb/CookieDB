import { Document, PossibleTypes } from "./types.ts";

type ValidTypes = ParseTree | PossibleTypes;

interface ParseTree {
  condition: string;
  children: ValidTypes[];
}

/**
 * Takes an input condition and a document and returns an abstract syntax tree representation of it
 */
export function parseCondition(
  condition: string,
  val: Document,
): ValidTypes {
  condition = condition.trim();
  const functionAndInputsRegex = /^(.+?)\((.*)\)$/;

  // base case
  if (!functionAndInputsRegex.test(condition)) {
    if (
      (condition.startsWith('"') && condition.endsWith('"')) ||
      (condition.startsWith("'") && condition.endsWith("'"))
    ) {
      return condition.slice(1, condition.length - 1);
    }

    if (condition === "null") {
      return null;
    }

    if (condition === "true") {
      return true;
    }

    if (condition === "false") {
      return false;
    }

    if (!isNaN(+condition)) {
      return +condition;
    }

    if (condition.startsWith("$")) {
      const properties = condition.slice(1).split(".");
      let value: Document | PossibleTypes = val;
      for (const property of properties) {
        if (
          typeof value !== "object" || value === null ||
          !Object.hasOwn(value, property)
        ) throw `Invalid property key ${condition}`;
        value = value[property];
      }

      return value as PossibleTypes;
    }

    throw (`failed to parse condition (${condition})`);
  }

  // extract relevant parts
  const parts = condition.match(functionAndInputsRegex);

  if (parts === null) throw (`failed to parse condition (${condition})`);

  const [_, name, inputs] = parts;

  const rawChildren: string[] = [];

  let paranthesis = 0;
  let inString = "";
  let curString = "";

  for (const char of inputs) {
    if (char === "," && paranthesis === 0 && inString === "") {
      rawChildren.push(curString);
      curString = "";
      continue;
    }

    if (char === "'") {
      if (inString === "") {
        inString = "'";
      } else if (inString === "'") {
        inString = "";
      }
    }

    if (char === '"') {
      if (inString === "") {
        inString = '"';
      } else if (inString === '"') {
        inString = "";
      }
    }

    if (char === "(") {
      paranthesis++;
    }

    if (char === ")") {
      paranthesis--;
    }

    curString += char;
  }
  rawChildren.push(curString);

  const children: ValidTypes[] = rawChildren.map((child) =>
    parseCondition(child, val)
  );

  return {
    condition: name,
    children,
  };
}

/**
 * Takes an abstract syntax tree and evaluates it
 */
export function evaluateCondition(parsedTree: ValidTypes) {
  if (
    typeof parsedTree === "string" || typeof parsedTree === "number" ||
    typeof parsedTree === "boolean" || parsedTree === null
  ) return parsedTree;

  const children: PossibleTypes[] = parsedTree.children.map((child) =>
    evaluateCondition(child)
  );

  switch (parsedTree.condition) {
    case "and":
      return children.reduce((prev, cur) => prev && cur, true);

    case "or":
      return children.reduce((prev, cur) => prev || cur, false);

    case "starts_with":
      if (children.length !== 2) throw "Expected 2 children for startsWith";
      if (typeof children[0] !== "string" || typeof children[1] !== "string") {
        throw "Expected both children of startsWith to be a string";
      }
      return children[0].startsWith(children[1]);

    case "ends_with":
      if (children.length !== 2) throw "Expected 2 children for endsWith";
      if (typeof children[0] !== "string" || typeof children[1] !== "string") {
        throw "Expected both children of endsWith to be a string";
      }
      return children[0].endsWith(children[1]);

    case "to_lower":
      if (children.length !== 1) throw "Expected 1 child for to_lower";
      if (typeof children[0] !== "string") {
        throw "Expected child of to_lower to be a string";
      }
      return children[0].toLowerCase();

    case "to_upper":
      if (children.length !== 1) throw "Expected 1 child for to_upper";
      if (typeof children[0] !== "string") {
        throw "Expected child of to_upper to be a string";
      }
      return children[0].toUpperCase();

    case "gt":
      if (children.length !== 2) throw "Expected 2 children for gt";
      if (typeof children[0] !== "number" || typeof children[1] !== "number") {
        throw "Expected children of gt to be a number";
      }
      return children[0] > children[1];

    case "lt":
      if (children.length !== 2) throw "Expected 2 children for lt";
      if (typeof children[0] !== "number" || typeof children[1] !== "number") {
        throw "Expected children of lt to be a number";
      }
      return children[0] < children[1];

    case "eq":
      if (children.length !== 2) throw "Expected 2 children for eq";
      return children[0] === children[1];

    case "gt_or_eq":
      if (children.length !== 2) throw "Expected 2 children for gt_or_eq";
      if (typeof children[0] !== "number" || typeof children[1] !== "number") {
        throw "Expected children of gt_or_eq to be a number";
      }
      return children[0] >= children[1];

    case "lt_or_eq":
      if (children.length !== 2) throw "Expected 2 children for lt_or_eq";
      if (typeof children[0] !== "number" || typeof children[1] !== "number") {
        throw "Expected children of lt_or_eq to be a number";
      }
      return children[0] <= children[1];

    case "subtract":
      if (children.length !== 2) throw "Expected 2 children for subtract";
      if (typeof children[0] !== "number" || typeof children[1] !== "number") {
        throw "Expected children of subtract to be a number";
      }
      return children[0] - children[1];

    case "divide":
      if (children.length !== 2) throw "Expected 2 children for divide";
      if (typeof children[0] !== "number" || typeof children[1] !== "number") {
        throw "Expected children of divide to be a number";
      }
      return children[1] === 0 ? null : (children[0] / children[1]);

    case "add":
      for (const child of children) {
        if (typeof child !== "number") throw "Expected a numeric child for add";
      }
      return (children as number[]).reduce((prev, cur) => prev + cur, 0);

    case "multiply":
      for (const child of children) {
        if (typeof child !== "number") {
          throw "Expected a numeric child for multiply";
        }
      }
      return (children as number[]).reduce((prev, cur) => prev * cur, 1);

    case "current_time":
      return Date.now();

    case "to_date_string":
      if (children.length !== 1) throw "Expected a child for to_date_string";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for to_date_string";
      }
      return (new Date(children[0])).toUTCString();

    case "year":
      if (children.length !== 1) throw "Expected a child for year";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for year";
      }
      return (new Date(children[0])).getUTCFullYear();

    case "month":
      if (children.length !== 1) throw "Expected a child for month";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for month";
      }
      return (new Date(children[0])).getUTCMonth();

    case "hour":
      if (children.length !== 1) throw "Expected a child for hour";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for hour";
      }
      return (new Date(children[0])).getUTCHours();

    case "minute":
      if (children.length !== 1) throw "Expected a child for minute";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for minute";
      }
      return (new Date(children[0])).getUTCMinutes();

    case "second":
      if (children.length !== 1) throw "Expected a child for second";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for second";
      }
      return (new Date(children[0])).getUTCSeconds();

    case "day_of_week":
      if (children.length !== 1) throw "Expected a child for day_of_week";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for day_of_week";
      }
      return (new Date(children[0])).getUTCDay();

    case "day_of_month":
      if (children.length !== 1) throw "Expected a child for day_of_month";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for day_of_month";
      }
      return (new Date(children[0])).getUTCDate();

    case "if_else":
      return children[0] ? children[1] : children[2];

    case "not":
      return !children[0];

    case "in_range":
      if (children.length !== 3) throw "Expected three children for in_range";
      if (
        typeof children[0] !== "number" || typeof children[1] !== "number" ||
        typeof children[2] !== "number"
      ) throw "Expected numeric children for in_range";
      return children[0] > children[1] && children[0] < children[2];

    case "coalesce":
      return children.reduce((prev, cur) => prev === null ? cur : prev, null);

    case "abs":
      if (children.length !== 1) throw "Expected one child for abs";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for abs";
      }
      return Math.abs(children[0]);

    case "asin":
      if (children.length !== 1) throw "Expected one child for asin";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for asin";
      }
      return Math.asin(children[0]);

    case "acos":
      if (children.length !== 1) throw "Expected one child for acos";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for acos";
      }
      return Math.acos(children[0]);

    case "atan":
      if (children.length !== 1) throw "Expected one child for atan";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for atan";
      }
      return Math.atan(children[0]);

    case "atan2":
      if (children.length !== 2) throw "Expected two children for atan2";
      if (typeof children[0] !== "number" || typeof children[1] !== "number") {
        throw "Expected two numeric children for atan2";
      }
      return Math.atan2(children[0], children[1]);

    case "average":
      for (const child of children) {
        if (typeof child !== "number") {
          throw "Expected a numeric child for average";
        }
      }
      return (children as number[]).reduce((prev, cur) => prev + cur, 0) /
        children.length;

    case "ceil":
      if (children.length !== 1) throw "Expected one child for ceil";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for ceil";
      }
      return Math.ceil(children[0]);

    case "floor":
      if (children.length !== 1) throw "Expected one child for floor";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for floor";
      }
      return Math.floor(children[0]);

    case "round":
      if (children.length !== 1) throw "Expected one child for round";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for round";
      }
      return Math.round(children[0]);

    case "sin":
      if (children.length !== 1) throw "Expected one child for sin";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for sin";
      }
      return Math.sin(children[0]);

    case "cos":
      if (children.length !== 1) throw "Expected one child for cos";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for cos";
      }
      return Math.cos(children[0]);

    case "tan":
      if (children.length !== 1) throw "Expected one child for tan";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for tan";
      }
      return Math.tan(children[0]);

    case "sec":
      if (children.length !== 1) throw "Expected one child for sec";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for sec";
      }
      return Math.cos(children[0]) === 0 ? null : (1 / Math.cos(children[0]));

    case "csc":
      if (children.length !== 1) throw "Expected one child for csc";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for csc";
      }
      return Math.sin(children[0]) === 0 ? null : (1 / Math.sin(children[0]));

    case "cot":
      if (children.length !== 1) throw "Expected one child for cot";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for cot";
      }
      return Math.tan(children[0]) === 0 ? null : (1 / Math.tan(children[0]));

    case "degrees":
      if (children.length !== 1) throw "Expected one child for degrees";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for degrees";
      }
      return children[0] * (180 / Math.PI);

    case "radians":
      if (children.length !== 1) throw "Expected one child for radians";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for radians";
      }
      return children[0] * (Math.PI / 180);

    case "exp":
      if (children.length !== 1) throw "Expected one child for exp";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for exp";
      }
      return Math.exp(children[0]);

    case "power":
      if (children.length !== 2) throw "Expected two children for power";
      if (typeof children[0] !== "number" || typeof children[1] !== "number") {
        throw "Expected two numeric children for power";
      }
      return Math.pow(children[0], children[1]);

    case "log":
      if (children.length !== 2) throw "Expected two children for log";
      if (typeof children[0] !== "number" || typeof children[1] !== "number") {
        throw "Expected two numeric children for log";
      }
      return Math.log(children[0]) / Math.log(children[1]);

    case "max":
      for (const child of children) {
        if (typeof child !== "number") throw "Expected a numeric child for max";
      }
      return (children as number[]).reduce(
        (prev, cur) => Math.max(prev, cur),
        Number.MIN_SAFE_INTEGER,
      );

    case "min":
      for (const child of children) {
        if (typeof child !== "number") throw "Expected a numeric child for min";
      }
      return (children as number[]).reduce(
        (prev, cur) => Math.min(prev, cur),
        Number.MAX_SAFE_INTEGER,
      );

    case "pi":
      return Math.PI;

    case "random":
      return Math.random();

    case "sign":
      if (children.length !== 1) throw "Expected one child for sign";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for sign";
      }
      return children[0] > 0 ? 1 : (children[0] === 0 ? 0 : -1);

    case "sqrt":
      if (children.length !== 1) throw "Expected one child for sqrt";
      if (typeof children[0] !== "number") {
        throw "Expected a numeric child for sqrt";
      }
      return Math.sqrt(children[0]);

    default:
      throw (`Unknown condition: ${parsedTree.condition}`);
  }
}
