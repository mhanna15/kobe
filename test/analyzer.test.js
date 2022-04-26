import util from "util";
import assert from "assert/strict";
import ast from "../src/ast.js";
import analyze from "../src/analyzer.js";

const semanticChecks = [
  ["variables can be printed", "num x = 1 print(x)"],
  ["variables can be reassigned", "num x = 1 x = 2"],
];

const semanticErrors = [
  ["using undeclared identifiers", "print(x)", /Identifier "x" not declared/],
  [
    "a variable used as function",
    "num x = 1 x(2)",
    /x was expected to be a Function/,
  ],
  [
    "re-declared identifier",
    "num x = 1 num x = 2",
    /Variable x already declared/,
  ],
];

const source = `num championships = 100 
                num job add(num a, num b) {output a add b}
                if (championships > 50) {print("You are Kobe")}`;

const expected = `   1 | Program statements=[#2,#3,#9]
2 | VariableDeclaration type='num' variable=(Id,"championships") initializer=(Num,"100")
3 | FunctionDeclaration fun=#4 chunk=[#7]
4 | Function returnType='num' id=(Id,"add") param=[#5,#6]
5 | Parameter type='num' name=(Id,"a")
6 | Parameter type='num' name=(Id,"b")
7 | OutputStatement expression=#8
8 | BinaryExpression op='add' left=(Id,"a") right=(Id,"b")
9 | IfStatement test=#10 chunk=[#11] alternate=[]
10 | BinaryExpression op='>' left=(Id,"championships") right=(Num,"50")
11 | PrintStatement argument=(Quote,""You are Kobe"")`;

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(ast(source)));
    });
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(ast(source)), errorMessagePattern);
    });
  }
  it(`produces the expected graph for the simple sample program`, () => {
    assert.deepEqual(util.format(analyze(ast(source))), expected);
  });
});
