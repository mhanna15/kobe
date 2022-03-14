import fs from "fs";
import ohm from "ohm-js";
import * as core from "./core.js";

const kobeGrammar = ohm.grammar(fs.readFileSync("src/kobe.ohm"));

const astBuilder = kobeGrammar.createSemantics().addOperation("ast", {
    Program(statements) {
        return new core.Program(statements.ast());
    },
    Statement_vardec(_let, id, _eq, initializer) {
        return new core.VariableDeclaration(id.ast(), initializer.ast());
    },
    Statement_fundec(_fun, id, _open, params, _close, _equals, JobChunk) {
        return new core.FunctionDeclaration(
            id.ast(),
            params.asIteration().ast(),
            JobChunk.ast()
        );
    },
    Statement_assign(id, _eq, expression) {
        return new core.Assignment(id.ast(), expression.ast());
    },
    Statement_print(_print, argument) {
        return new core.PrintStatement(argument.ast());
    },
    Statement_while(_grindUntil, test, Chunk) {
        return new core.WhileStatement(test.ast(), Chunk.ast());
    },
    Statement_return(_output, expression) {
        return new core.returnStatement(expression.ast());
    },
    Chunk(_open, body, _close) {
        return body.ast();
    },
    JobChunk(_open, body, _close, statement_return) {
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
    _terminal() {
        return new core.Token("Sym", this.source);
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
