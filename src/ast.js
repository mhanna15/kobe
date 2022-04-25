import fs from "fs";
import ohm from "ohm-js";
import * as core from "./core.js";

const kobeGrammar = ohm.grammar(fs.readFileSync("src/kobe.ohm"));

const astBuilder = kobeGrammar.createSemantics().addOperation("ast", {
  Program(statements) {
    return new core.Program(statements.ast());
  },
  Statement_vardec(type, id, _eq, initializer) {
    return new core.VariableDeclaration(
      type.ast(),
      id.ast(),
      initializer.ast()
    );
  },
  Statement_coil(_coil, until, chunk) {
    return new core.CoilStatement(until.ast(), chunk.ast());
  },
  Statement_grind(_grindUntil, consequent, chunk) {
    return new core.GrindUntilStatement(consequent.ast(), chunk.ast());
  },
  Statement_if(_if, condition, chunk, elif) {
    return new core.IfStatement(condition.ast(), chunk.ast(), elif.ast());
  },
  Statement_repeat(_repeat, _open, num, _close, chunk) {
    return new core.RepeatStatement(num.ast(), chunk.ast());
  },
  Elif_elif(_elif, condition, chunk) {
    return new core.IfStatement(condition.ast(), chunk.ast());
  },
  Until_until(_open, param, _split, range, _close) {
    return new core.UntilRange(param.ast(), range.ast());
  },
  Range_range(low, _to, high) {
    return new core.Range(low.ast(), high.ast());
  },
  Statement_fundec(funcType, _job, id, _open, params, _close, JobChunk) {
    return new core.FunctionDeclaration(
      new core.Function(funcType.ast(), id.ast(), params.asIteration().ast()),
      JobChunk.ast()
    );
  },
  Param_param(type, id) {
    return new core.Parameter(type.ast(), id.ast());
  },
  Statement_assign(id, _eq, expression) {
    return new core.Reassignment(id.ast(), expression.ast());
  },
  Statement_print(_print, argument) {
    return new core.PrintStatement(argument.ast());
  },
  Statement_grind(_grindUntil, test, Chunk) {
    return new core.GrindUntilStatement(test.ast(), Chunk.ast());
  },
  Return_return(_output, expression) {
    return new core.OutputStatement(expression.ast());
  },
  Chunk(_open, body, _close) {
    return body.ast();
  },
  JobChunk(_open, body, statement_return, _close) {
    return body.ast(), statement_return.ast();
  },
  Exp_unary(op, operand) {
    return new core.UnaryExpression(op.sourceString, operand.ast());
  },
  Exp1_binary(left, _or, right) {
    return new core.BinaryExpression("or", left.ast(), right.ast());
  },
  Exp2_binary(left, _and, right) {
    return new core.BinaryExpression("and", left.ast(), right.ast());
  },
  Exp3_binary(left, compare, right) {
    return new core.BinaryExpression(
      compare.sourceString,
      left.ast(),
      right.ast()
    );
  },
  Exp4_binary(left, addeqop, right) {
    return new core.BinaryExpression(
      addeqop.sourceString,
      left.ast(),
      right.ast()
    );
  },
  Exp5_binary(left, addop, right) {
    return new core.BinaryExpression(
      addop.sourceString,
      left.ast(),
      right.ast()
    );
  },
  Exp6_binary(left, mulop, right) {
    return new core.BinaryExpression(
      mulop.sourceString,
      left.ast(),
      right.ast()
    );
  },
  Exp7_binary(left, _power, right) {
    return new core.BinaryExpression("to the", left.ast(), right.ast());
  },
  Exp7_unary(op, operand) {
    return new core.UnaryExpression(op.ast(), operand.ast());
  },
  Exp8_parens(_open, expression, _close) {
    return expression.ast();
  },
  Call(id, _open, args, _close) {
    return new core.Call(id.ast(), args.asIteration().ast());
  },
  id(_first, _rest) {
    return new core.Token("Id", this.source);
  },
  num(_whole, _point, _fraction) {
    return new core.Token("Num", this.source);
  },
  quote(_open, _text, _close) {
    return new core.Token("Quote", this.source);
  },
  _terminal() {
    return this.sourceString;
  },
  _iter(...children) {
    return children.map((child) => child.ast());
  },
});

export default function ast(sourceCode) {
  const match = kobeGrammar.match(sourceCode);
  if (!match.succeeded()) core.error(match.message);
  return astBuilder(match).ast();
}
