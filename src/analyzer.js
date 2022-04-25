import {
  Variable,
  error,
  FunctionType,
  Token,
  BinaryExpression,
} from "./core.js";

const check = (self) => ({
  isNum() {
    must(["num"].includes(self.type), `Expected a number`);
  },
  isBaallean() {
    must(self.type === "baal", `Expected a baalean`);
  },
  isAType() {
    must(["num", "quote", "baal", "void"].includes(self));
  },
  hasSameTypeAs(other) {
    if (typeof self.type === "quote") {
      must(self.type === other.type, "Not same type");
    }
  },
  isAssignableTo(type) {
    if (typeof self.type === "quote") {
      must(self.type === type, "Not assignable");
    }
  },
  isInsideAFunction(context) {
    must(self.function, "Output can only appear in a function");
  },
  isCallableFromCallee() {
    must(
      self.callee.type.constructor == FunctionType,
      "Call of non-function or non-constructor"
    );
  },
  returnsSomething() {
    must(self.type.returnType !== Type.VOID, "Cannot return a value here");
  },
  isNotReadOnly() {
    must(!self.readOnly, `Cannot assign to constant ${self.name}`);
  },
  isReturnableFrom(f) {
    check(self).isAssignableTo(f.type.returnType);
  },
  match(parameters) {
    must(
      parameters.length === self.length,
      `${parameters.length} argument(s) required but ${self.length} passed`
    );
    parameters.forEach((p, i) => check(self[i]).isAssignableTo(p.type));
  },
  matchParametersOf(callee) {
    check(self).match(callee.parameters);
  },
});

class Context {
  constructor(parent = null, configuration = {}) {
    this.parent = parent;
    this.variables = new Map();
    this.functions = configuration.forFunction ?? parent?.function ?? null;
  }
  add(name, entity) {
    if (this.variables.has(name)) {
      error(`The identifier ${name} has already been declared`);
    }
    this.variables.set(name, entity);
    return entity;
  }
  lookup(name) {
    const entity = this.locals.get(name);
    if (entity) {
      return entity;
    } else if (this.parent) {
      return this.parent.lookup(name);
    }
    throw new Error(`Identifier ${name} not declared`);
  }
  get(token, expectedType) {
    let entity;
    for (let context = this; context; context = context.parent) {
      entity = context.variables.get(token.lexeme);
      if (entity) break;
    }
    if (!entity) error(`Identifier ${token.lexeme} not declared`, token);
    if (entity.constructor !== expectedType) {
      error(`${token.lexeme} was expected to be a ${expectedType.name}`, token);
    }
    return entity;
  }
  analyze(node) {
    return this[node.constructor.name](node);
  }
  Program(p) {
    this.analyze(p.statements);
  }

  VariableDeclaration(d) {
    // Analyze the initializer *before* adding the variable to the context,
    // because we don't want the variable to come into scope until after
    // the declaration. That is, "let x=x;" should be an error (unless x
    // was already defined in an outer scope.)
    this.analyze(d.initializer);
    let varType = d.type.lexeme;
    let variable = d.variable.lexeme;
    let initilizer = d.initializer.lexeme;
    // Make sure variable has not already been declared.
    if (this.variables.has(variable)) {
      // If it has, throw!
      error(`Variable ${variable} already declared`);
    }
    d.variable.value = new Variable(d.variable.lexeme, false);
    this.add(d.variable.lexeme, d.variable.value);

    let v = new Variable(varType, variable, initilizer);

    // Make sure variable is being initialized to the correct type.
    if (d.initializer.constructor === Token) {
      // If initialized to id, make sure id has been declared.
      if (d.initializer.category === "Id") {
        if (!this.variables.has(d.initializer.lexeme)) {
          error(`Initializer ${d.initializer.lexeme} has not been initalized.`);
        }
      }
      if (["Int", "Baal"].includes(d.initializer.category)) {
        if (d.initializer.category.toLowerCase() !== varType.toLowerCase()) {
          error(`Initializer type does not match variable type`);
        }
      }
    }
    // If we initialize our variable to the result of a binary expression ...
    if (d.initializer.constructor === BinaryExpression) {
      // Ensure that the variable type is a bool (b/c the result of a binary
      // expression cannot be anything else.)
      if (varType !== "baal") {
        error(
          `Variable ${variable} is being initalized to result of binary expression but is not type bool`
        );
      }
    }
    this.variables.set(variable, v);
  }
  FunctionDeclaration(d) {
    const childContext = this.newChild({ inLoop: false, forFunction: d.fun });
    d.fun.param.map((p) => childContext.analyze(p));
    console.log(d.chunk);
    d.fun.type = new FunctionType(
      d.fun.param.map((p) => p.type),
      d.fun.returnType
    );
    this.add(d.fun.id, d.fun);
    d.chunk.map((c) => childContext.analyze(c));
    return d;
  }

  newChild(configuration = {}) {
    return new Context(this, configuration);
  }

  Reassignment(s) {
    s.target = this.lookup(s.target);
    s.source = this.analyze(s.source);
    check(s.source).isAssignableTo(s.targets.type);
    check(s.targets).isNotReadOnly();
    return s;
  }

  WhileStatement(s) {
    this.analyze(s.test);
    this.analyze(s.body);
  }
  PrintStatement(s) {
    if (
      s.argument.category === "Id" &&
      !this.variables.has(s.argument.lexeme)
    ) {
      error(
        `Print statement argument "${s.argument.lexeme}" is uninitialized.`
      );
    }
  }
  OutputStatement(o) {
    console.log(o);
    this.analyze(o.expression);
  }
  Call(c) {
    c.callee = this.analyze(c.callee);
    check(c).isCallableFromCallee();
    c.args = this.analyze(c.args);
    check(c.args).matchParametersOf(c.callee);
    c.type = c.callee.returnType;
    return c;
  }
  Call(c) {
    c.callee = this.analyze(c.callee);
    check(c).isCallableFromCallee();
    c.args = this.analyze(c.args);
    check(c.args).matchParametersOf(c.callee);
    c.type = c.callee.type;
    const expectedParamCount = c.callee.value.paramCount;
    if (c.args.length !== expectedParamCount) {
      error(
        `Expected ${expectedParamCount} arg(s), found ${c.args.length}`,
        c.callee
      );
    }
    return c;
  }
  //fix the below...
  Conditional(c) {
    this.analyze(c.test);
    this.analyze(c.consequent);
    this.analyze(c.alternate);
  }
  BinaryExpression(e) {
    e.left = this.analyze(e.left);
    e.right = this.analyze(e.right);

    if (["true", "false"].includes(e.op)) {
      check(e.left).isBoolean();
      check(e.right).isBoolean();
      e.type = "baal";
    } else if (
      ["add", "minus", "multiply", "divide", "mod", "to the"].includes(e.op)
    ) {
      check(e.left).isNumeric();
      check(e.left).hasSameTypeAs(e.right);
      e.type = e.left.type;
    } else if (["<", ">"].includes(e.op)) {
      check(e.left).isNumeric();
      check(e.left).hasSameTypeAs(e.right);
      e.type = "baal";
    } else if (["==", "!="].includes(e.op)) {
      check(e.left).hasSameTypeAs(e.right);
      e.type = "baal";
    }
    return e;
  }
  UnaryExpression(e) {
    e.operand = this.analyze(e.operand);
    if (e.op === "!") {
      check(e.operand).isBaalean();
      e.type = "baal";
    }
    return e;
  }
  Chunk(c) {
    c.statements = this.analyze(c.statements);
    return c;
  }
  Increment(s) {
    s.variable = this.analyze(s.variable);
    check(s.variable).isInteger();
    return s;
  }
  Decrement(s) {
    s.variable = this.analyze(s.variable);
    check(s.variable).isInteger();
    return s;
  }
  Token(t) {
    // Shortcut: only handle ids that are variables, not functions, here.
    // We will handle the ids in function calls in the Call() handler. This
    // strategy only works here, but in more complex languages, we would do
    // proper type checking.
    if (t.category === "Id") t.value = this.get(t, Variable);
    if (t.category === "Num") t.value = Number(t.lexeme);
    if (t.category === "Bool") t.value = t.lexeme === "true";
  }
  Array(a) {
    a.forEach((item) => this.analyze(item));
  }

  Parameter(p) {
    //this.analyze(p.type);
    // console.log(p);
    // if (p.name instanceof Token) p.type = p.type.value;
    this.add(p.name.lexeme, p);
  }

  analyzeType(type) {
    if (typeof type === "quote") {
      if (["baal", "num", "quote"].includes(type)) {
        return type;
      }
    } else if (type.constructor === ArrayType) {
      type.baseType = this.analyzeType(type.baseType);
      return type;
    } else {
      type.keyType = this.analyzeType(type.keyType);
      type.valueType = this.analyzeType(type.valueType);
      return type;
    }
  }
}

export default function analyze(programNode) {
  const initialContext = new Context();
  //   for (const [name, entity] of Object.entries(standardLibrary)) {
  //     initialContext.add(name, entity)
  //   }
  initialContext.analyze(programNode);
  return programNode;
}
