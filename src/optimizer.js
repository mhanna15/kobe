// OPTIMIZER
//
// This module exports a single function to perform machine-independent
// optimizations on the analyzed semantic graph.
//
// The only optimizations supported here are:
//
//   - assignments to self (x = x) turn into no-ops
//   - constant folding
//   - some strength reductions (+0, -0, *0, *1, etc.)
//   - turn references to built-ins true and false to be literals
//   - remove all disjuncts in || list after literal true
//   - remove all conjuncts in && list after literal false
//   - while-false becomes a no-op
//   - repeat-0 is a no-op
//   - for-loop over empty array is a no-op
//   - for-loop with low > high is a no-op
//   - if-true and if-false reduce to only the taken arm
//
// The optimizer also replaces token references with their actual values,
// since the original token line and column numbers are no longer needed.
// This simplifies code generation.

import * as core from "./core.js";

export default function optimize(node) {
  return optimizers[node.constructor.name](node);
}

const optimizers = {
  Program(p) {
    p.statements = optimize(p.statements);
    return p;
  },
  VariableDeclaration(d) {
    d.variable = optimize(d.variable);
    d.initializer = optimize(d.initializer);
    return d;
  },
  TypeDeclaration(d) {
    d.type = optimize(d.type);
    return d;
  },
  Field(f) {
    f.name = f.name.lexeme;
    return f;
  },
  StructType(d) {
    d.fields = optimize(d.fields);
    return d;
  },
  FunctionDeclaration(d) {
    d.fun = optimize(d.fun);
    if (d.chunk) d.chunk = optimize(d.chunk);
    return d;
  },
  Variable(v) {
    return v;
  },
  Function(f) {
    return f;
  },
  Parameter(p) {
    p.name = optimize(p.name);
    return p;
  },
  Increment(s) {
    s.variable = optimize(s.variable);
    return s;
  },
  Decrement(s) {
    s.variable = optimize(s.variable);
    return s;
  },
  Assignment(s) {
    s.source = optimize(s.source);
    s.target = optimize(s.target);
    if (s.source === s.target) {
      return [];
    }
    return s;
  },
  OutputStatement(s) {
    s.expression = optimize(s.expression);
    return s;
  },
  ShortOutputStatement(s) {
    return s;
  },
  IfStatement(s) {
    s.test = optimize(s.test);
    s.chunk = optimize(s.chunk);
    s.alternate = optimize(s.alternate);
    if (s.test.constructor === Boolean) {
      return s.test ? s.chunk : s.alternate;
    }
    return s;
  },
  ShortIfStatement(s) {
    s.test = optimize(s.test);
    s.chunk = optimize(s.chunk);
    if (s.test.constructor === Boolean) {
      return s.test ? s.chunk : [];
    }
    return s;
  },
  GrindUntilStatement(s) {
    s.condition = optimize(s.condition);
    if (s.condition === false) {
      // while false is a no-op
      return [];
    }
    s.chunk = optimize(s.chunk);
    return s;
  },
  RepeatStatement(s) {
    s.count = optimize(s.count);
    if (s.count === 0) {
      // repeat 0 times is a no-op
      return [];
    }
    s.chunk = optimize(s.chunk);
    return s;
  },
  RangeStatement(s) {
    s.low = optimize(s.low);
    s.high = optimize(s.high);
    if (s.low.constructor === Number) {
      if (s.high.constructor === Number) {
        if (s.low > s.high) {
          return [];
        }
      }
    }
    return s;
  },
  CoilStatement(s) {
    s.until = optimize(s.until);
    s.chunk = optimize(s.chunk);
    if (s.collection.constructor === core.EmptyArray) {
      return [];
    }
    return s;
  },
  BinaryExpression(e) {
    e.op = optimize(e.op);
    e.left = optimize(e.left);
    e.right = optimize(e.right);
    if (e.op === "and") {
      // Optimize boolean constants in && and ||
      if (e.left === true) return e.right;
      else if (e.right === true) return e.left;
    } else if (e.op === "or") {
      if (e.left === false) return e.right;
      else if (e.right === false) return e.left;
    } else if ([Number].includes(e.left.constructor)) {
      // Numeric constant folding when left operand is constant
      if ([Number].includes(e.right.constructor)) {
        if (e.op === "add") return e.left + e.right;
        else if (e.op === "minus") return e.left - e.right;
        else if (e.op === "multiply") return e.left * e.right;
        else if (e.op === "divide") return e.left / e.right;
        else if (e.op === "to the") return e.left ** e.right;
        else if (e.op === "<") return e.left < e.right;
        else if (e.op === "==") return e.left === e.right;
        else if (e.op === "!=") return e.left !== e.right;
        else if (e.op === ">") return e.left > e.right;
      } else if (e.left === 0 && e.op === "add") return e.right;
      else if (e.left === 1 && e.op === "multiply") return e.right;
      else if (e.left === 0 && e.op === "minus")
        return new core.UnaryExpression("-", e.right);
      else if (e.left === 1 && e.op === "to the") return 1;
      else if (e.left === 0 && ["multiply", "divide"].includes(e.op)) return 0;
    } else if (e.right.constructor === Number) {
      // Numeric constant folding when right operand is constant
      if (["add", "minus"].includes(e.op) && e.right === 0) return e.left;
      else if (["multipy", "divide"].includes(e.op) && e.right === 1)
        return e.left;
      else if (e.op === "multiply" && e.right === 0) return 0;
      else if (e.op === "to the" && e.right === 0) return 1;
    }
    return e;
  },
  UnaryExpression(e) {
    e.op = optimize(e.op);
    e.operand = optimize(e.operand);
    if (e.operand.constructor === Number) {
      if (e.op === "-") {
        return -e.operand;
      }
    }
    return e;
  },
  MemberExpression(e) {
    e.object = optimize(e.object);
    return e;
  },
  Call(c) {
    c.callee = optimize(c.callee);
    c.args = optimize(c.args);
    return c;
  },
  Num(e) {
    return e;
  },
  Baalean(e) {
    return e;
  },
  Quote(e) {
    return e;
  },
  Token(t) {
    // All tokens get optimized away and basically replace with either their
    // value (obtained by the analyzer for literals and ids) or simply with
    // lexeme (if a plain symbol like an operator)
    return t.value ?? t.lexeme;
  },
  Array(a) {
    // Flatmap since each element can be an array
    return a.flatMap(optimize);
  },
};
