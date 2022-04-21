import { Variable, Function, error, FunctionType } from "./core.js";

class Context {
  constructor(parent = null) {
    this.parent = parent;
    this.locals = new Map();
  }
  add(name, entity) {
    if (this.locals.has(name)) {
      error(`The identifier ${name} has already been declared`);
    }
    this.locals.set(name, entity);
    return entity;
  }
  get(token, expectedType) {
    let entity;
    for (let context = this; context; context = context.parent) {
      entity = context.locals.get(token.lexeme);
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
    d.variable.value = new Variable(d.variable.lexeme, false);
    this.add(d.variable.lexeme, d.variable.value);
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

  Assignment(s) {
    this.analyze(s.source);
    this.analyze(s.target);
    if (s.target.value.readOnly) {
      error(`The identifier ${s.target.lexeme} is read only`, s.target);
    }
  }
  WhileStatement(s) {
    this.analyze(s.test);
    this.analyze(s.body);
  }
  PrintStatement(s) {
    this.analyze(s.argument);
  }
  OutputStatement(o) {
    console.log(o);
    this.analyze(o.expression);
  }
  Call(c) {
    this.analyze(c.args);
    c.callee.value = this.get(c.callee, Function);
    const expectedParamCount = c.callee.value.paramCount;
    if (c.args.length !== expectedParamCount) {
      error(
        `Expected ${expectedParamCount} arg(s), found ${c.args.length}`,
        c.callee
      );
    }
  }
  //fix the below...
  Conditional(c) {
    this.analyze(c.test);
    this.analyze(c.consequent);
    this.analyze(c.alternate);
  }
  BinaryExpression(e) {
    this.analyze(e.left);
    this.analyze(e.right);
  }
  UnaryExpression(e) {
    this.analyze(e.operand);
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
