// Core classes and objects
//
// This module defines classes for the AST nodes. Only the constructors are
// defined here. Semantic analysis methods, optimization methods, and code
// generation are handled by other modules. This keeps the compiler organized
// by phase.

import util from "util";

export class Parameter {
  constructor(type, name) {
    Object.assign(this, { type, name });
  }
}

export class Program {
  constructor(statements) {
    this.statements = statements;
  }
}

export class Chunk {
  constructor(statements) {
    this.statements = statements;
  }
}

// export class TypeDeclaration {
//   constructor(type) {
//     this.type = type;
//   }
// }

export class Type {
  static BAAL = new Type("baal");
  static NUM = new Type("num");
  static QUOTE = new Type("quote");
  static VOID = new Type("void");
  //static ANY = new Type("any");
  constructor(description) {
    Object.assign(this, { description });
  }
}

export class VariableDeclaration {
  constructor(type, variable, initializer) {
    Object.assign(this, { type, variable, initializer });
  }
}

export class FunctionDeclaration {
  constructor(fun, chunk) {
    Object.assign(this, { fun, chunk });
  }
}

export class FunctionType extends Type {
  constructor(paramTypes, returnType) {
    super(`(${paramTypes.map((t) => t.name).join(",")})->${returnType.name}`);
    Object.assign(this, { paramTypes, returnType });
  }
}

export class Reassignment {
  constructor(target, source) {
    Object.assign(this, { target, source });
  }
}

export class PrintStatement {
  constructor(argument) {
    Object.assign(this, { argument });
  }
}

export class OutputStatement {
  constructor(expression) {
    this.expression = expression;
  }
}

export class CoilStatement {
  // Example: coil (num i, 0 to 5) { process(i) }
  constructor(Until, Chunk) {
    Object.assign(this, { Until, Chunk });
  }
}

export class GrindUntilStatement {
  // Example: grindUntil(x < 5) {x--}
  constructor(Condition, Chunk) {
    Object.assign(this, { Condition, Chunk });
  }
}

export class UntilRange {
  constructor(Parameter, Range) {
    Object.assign(this, { Parameter, Range });
  }
}

export class Range {
  constructor(Low, High) {
    Object.assign(this, { Low, High });
  }
}

export class IfStatement {
  // Example: if x < 3 { shoot() } (elif ....)
  constructor(test, chunk, alternate) {
    Object.assign(this, { test, chunk, alternate });
  }
}

export class RepeatStatement {
  constructor(count, chunk) {
    Object.assign(this, { count, chunk });
  }
}

export class Increment {
  //count++
  constructor(variable) {
    this.variable = variable;
  }
}
export class Decrement {
  constructor(variable) {
    this.variable = variable;
  }
}

export class Call {
  constructor(callee, args) {
    Object.assign(this, { callee, args });
  }
}

export class BinaryExpression {
  constructor(op, left, right) {
    Object.assign(this, { op, left, right });
  }
}

export class UnaryExpression {
  constructor(op, operand) {
    Object.assign(this, { op, operand });
  }
}

// Token objects are wrappers around the Nodes produced by Ohm. We use
// them here just for simple things like numbers and identifiers. The
// Ohm node will go in the "source" property.
export class Token {
  constructor(category, source) {
    Object.assign(this, { category, source });
  }
  get lexeme() {
    return this.source.contents;
  }
}

export class Variable {
  constructor(type, name, readOnly) {
    Object.assign(this, { type, name, readOnly });
  }
}

export class Function {
  constructor(returnType, id, param) {
    Object.assign(this, { returnType, id, param });
  }
}

// export const standardLibrary = Object.freeze({
//   π: new Variable("π", true),
//   sqrt: new Function("sqrt", 1, true),
//   sin: new Function("sin", 1, true),
//   cos: new Function("cos", 1, true),
//   exp: new Function("exp", 1, true),
//   ln: new Function("ln", 1, true),
//   hypot: new Function("hypot", 2, true),
// });

// Throw an error message that takes advantage of Ohm's messaging
export function error(message, token) {
  if (token) {
    throw new Error(`${token.source.getLineAndColumnMessage()}${message}`);
  }
  throw new Error(message);
}

// Return a compact and pretty string representation of the node graph,
// taking care of cycles. Written here from scratch because the built-in
// inspect function, while nice, isn't nice enough. Defined properly in
// the root class prototype so that it automatically runs on console.log.
Program.prototype[util.inspect.custom] = function () {
  const tags = new Map();

  // Attach a unique integer tag to every node
  function tag(node) {
    if (tags.has(node) || typeof node !== "object" || node === null) return;
    if (node.constructor === Token) {
      // Tokens are not tagged themselves, but their values might be
      tag(node?.value);
    } else {
      // Non-tokens are tagged
      tags.set(node, tags.size + 1);
      for (const child of Object.values(node)) {
        Array.isArray(child) ? child.forEach(tag) : tag(child);
      }
    }
  }

  function* lines() {
    function view(e) {
      if (tags.has(e)) return `#${tags.get(e)}`;
      if (e?.constructor === Token) {
        return `(${e.category},"${e.lexeme}"${
          e.value ? "," + view(e.value) : ""
        })`;
      }
      if (Array.isArray(e)) return `[${e.map(view)}]`;
      return util.inspect(e);
    }
    for (let [node, id] of [...tags.entries()].sort((a, b) => a[1] - b[1])) {
      let type = node.constructor.name;
      let props = Object.entries(node).map(([k, v]) => `${k}=${view(v)}`);
      yield `${String(id).padStart(4, " ")} | ${type} ${props.join(" ")}`;
    }
  }

  tag(this);
  return [...lines()].join("\n");
};
