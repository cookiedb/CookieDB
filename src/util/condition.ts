type validTypes = ParseTree | string | boolean | number | null;

interface ParseTree {
  condition: string;
  children: validTypes[];
}

export function parseCondition(
  condition: string,
  val: string | boolean | number | null | any[],
): validTypes {
  condition = condition.trim();
  const functionAndInputsRegex = /^(.+?)\((.+)\)$/;

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
      if (typeof val === "object" && val !== null) {
        return val[parseInt(condition.replace("$", "") || "0")];
      }

      return val;
    }

    throw (`failed to parse condition (${condition})`);
  }

  // extract relevant parts
  const parts = condition.match(functionAndInputsRegex);

  if (parts === null) throw (`failed to parse condition (${condition})`);

  const [_, name, inputs] = parts;

  const rawChildren: string[] = [];

  let paranthesis = 0;
  let curString = "";

  for (const char of inputs) {
    if (char === "," && paranthesis === 0) {
      rawChildren.push(curString);
      curString = "";
      continue;
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

  const children: validTypes[] = rawChildren.map((child) =>
    parseCondition(child, val)
  );

  return {
    condition: name,
    children,
  };
}

export function evaluateCondition(parsedTree: validTypes) {
  if (
    typeof parsedTree === "string" || typeof parsedTree === "number" ||
    typeof parsedTree === "boolean" || parsedTree === null
  ) return parsedTree;

  const children: any[] = parsedTree.children.map((child) =>
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
      return children.reduce((prev, cur) => prev + cur, 0);
    
    case "multiply":
      return children.reduce((prev, cur) => prev * cur, 1);

    case "current_time":
      return Date.now();
    
    case "to_date_string":
      return (new Date(children[0])).toUTCString();
    
    case "year":
      return (new Date(children[0])).getUTCFullYear();
      
    case "month":
      return (new Date(children[0])).getUTCMonth();
    
    case "hour":
      return (new Date(children[0])).getUTCHours();

    case "minute":
      return (new Date(children[0])).getUTCMinutes();

    case "second":
      return (new Date(children[0])).getUTCSeconds();
    
    case "day_of_week":
      return (new Date(children[0])).getUTCDay();

    case "day_of_month":
      return (new Date(children[0])).getUTCDate();

    case "if_else":
      return children[0] ? children[1] : children[2]

    case "not":
      return !children[0]
    
    case "in_range":
      return children[0] > children[1] && children[0] < children[2]
    
    case "coalesce":
      return children.reduce((prev, cur) => prev === null ? cur : prev, null);

    case "abs":
      return Math.abs(children[0])
    
    case "asin":
      return Math.asin(children[0])
    
    case "acos":
      return Math.acos(children[0])
    
    case "atan":
      return Math.atan(children[0])
    
    case "atan2":
      return Math.atan2(children[0], children[1])
    
    case "average":
      return children.reduce((prev, cur) => prev + cur, 0) / children.length
    
    case "ceil":
      return Math.ceil(children[0])

    case "floor":
      return Math.floor(children[0])

    case "round":
      return Math.round(children[0])
    
    case "sin":
      return Math.sin(children[0])

    case "cos":
      return Math.cos(children[0])

    case "tan":
      return Math.tan(children[0])
    
    case "sec":
      return Math.cos(children[0]) === 0 ? null : (1 /  Math.cos(children[0]))

    case "csc":
      return Math.sin(children[0]) === 0 ? null : (1 /  Math.sin(children[0]))

    case "cot":
      return Math.tan(children[0]) === 0 ? null : (1 /  Math.tan(children[0]))
    
    case "degrees":
      return children[0] * (Math.PI/180)
    
    case "radians":
      return children[0] * (180/Math.PI)
    
    case "exp":
      return Math.exp(children[0])
    
    case "power":
      return Math.pow(children[0], children[1])

    case "log":
      return Math.log(children[0]) / Math.log(children[1])
    
    case "max":
      return children.reduce((prev, cur) => Math.max(prev, cur), Number.MIN_SAFE_INTEGER)
    
    case "min":
      return children.reduce((prev, cur) => Math.min(prev, cur), Number.MAX_SAFE_INTEGER)

    case "pi":
      return Math.PI
    
    case "random":
      return Math.random()
    
    case "sign":
      return children[0] > 0 ? 1 : (children[0] === 0 ? 0 : -1)
    
    case "sqrt":
      return Math.sqrt(children[0])

    default:
      throw (`Unknown condition: ${parsedTree.condition}`);
  }
}
