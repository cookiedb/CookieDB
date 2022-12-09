import { assert } from "../../deps.ts";

import { evaluateCondition, parseCondition } from "./condition.ts";

const evaluate = (condition: string) => {
  return evaluateCondition(parseCondition(condition, {}));
};

Deno.test("Examples in README work", () => {
  assert(evaluate("and(true, true, true)"));
  assert(evaluate("or(false, true, true)"));
  assert(evaluate("starts_with('cookie', 'co')"));
  assert(evaluate("ends_with('cookie', 'ie')"));
  assert(evaluate("eq(to_lower('cOOKIE'), 'cookie')"));
  assert(evaluate("eq(to_upper('Cookie'), 'COOKIE')"));
  assert(evaluate("gt(10, 5)"));
  assert(evaluate("lt(5,10)"));
  assert(evaluate("eq(true, true)"));
  assert(evaluate("gt_or_eq(12, 11)"));
  assert(evaluate("lt_or_eq(11, 12)"));
  assert(evaluate("eq(subtract(10, 5), 5)"));
  assert(evaluate("eq(divide(10, 5), 2)"));
  assert(evaluate("eq(add(1, 2, 3), 6)"));
  assert(evaluate("eq(multiply(1, 2, 3), 6)"));
  assert(evaluate("current_time()"));
  assert(
    evaluate(
      "eq(to_date_string(1668304518135), 'Sun, 13 Nov 2022 01:55:18 GMT')",
    ),
  );
  assert(evaluate("eq(year(1668304518135), 2022)"));
  assert(evaluate("eq(month(1668304518135), 10)"));
  assert(evaluate("eq(hour(1668304518135), 1)"));
  assert(evaluate("eq(minute(1668304518135), 55)"));
  assert(evaluate("eq(second(1668304518135), 18)"));
  assert(evaluate("eq(day_of_week(1668304518135), 0)"));
  assert(evaluate("eq(day_of_month(1668304518135), 13)"));
  assert(evaluate("if_else(true, true, false)"));
  assert(evaluate("not(false)"));
  assert(evaluate("in_range(5, 0, 10)"));
  assert(evaluate("coalesce(null, true, 'hi')"));
  assert(evaluate("eq(abs(-5), 5)"));
  assert(evaluate("eq(asin(0), 0)"));
  assert(evaluate("eq(acos(1), 0)"));
  assert(evaluate("eq(atan(0), 0)"));
  assert(evaluate("atan2(1, 1)"));
  assert(evaluate("eq(average(0, 5, 10), 5)"));
  assert(evaluate("eq(ceil(5.1), 6)"));
  assert(evaluate("eq(floor(5.1), 5)"));
  assert(evaluate("eq(round(5.1), 5)"));
  assert(evaluate("eq(sin(0), 0)"));
  assert(evaluate("eq(cos(0), 1)"));
  assert(evaluate("eq(tan(0), 0)"));
  assert(evaluate("eq(sec(0), 1)"));
  assert(evaluate("eq(csc(0), null)"));
  assert(evaluate("eq(cot(0), null)"));
  assert(evaluate("eq(degrees(pi()), 180)"));
  assert(evaluate("eq(radians(180), pi())"));
  assert(evaluate("eq(exp(0),1)"));
  assert(evaluate("eq(power(2, 4), power(4, 2))"));
  assert(evaluate("eq(log(256, 2), 8)"));
  assert(evaluate("eq(max(1, 5, -40, 1000), 1000)"));
  assert(evaluate("eq(min(1, 5, -40, 1000), -40)"));
  assert(evaluate("eq(pi(), 3.141592653589793)"));
  assert(evaluate("random()"));
  assert(evaluate("eq(sign(-3), -1)"));
  assert(evaluate("eq(sqrt(4), 2)"));
});
