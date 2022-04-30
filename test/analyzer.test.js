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
    /Call of non-function or non-constructor/,
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

const expected = `   1 | Program statements=[#2,#4,#13]
   2 | VariableDeclaration type='num' variable=#3 initializer=(Num,"100",100)
   3 | Variable type='num' name='championships' readOnly=undefined
   4 | FunctionDeclaration fun=#5 chunk=[#9]
   5 | Function returnType='num' id=(Id,"add") param=[#6,#7] type=#8
   6 | Parameter type='num' name=(Id,"a")
   7 | Parameter type='num' name=(Id,"b")
   8 | FunctionType description='(,)->undefined' paramTypes=['num','num'] returnType='num'
   9 | OutputStatement expression=#10
  10 | BinaryExpression op='add' left=(Id,"a",#11) right=(Id,"b",#12) type='num'
  11 | Variable type='num' name='a' readOnly=true
  12 | Variable type='num' name='b' readOnly=true
  13 | IfStatement test=#14 chunk=[#16] alternate=[]
  14 | BinaryExpression op='>' left=(Id,"championships",#15) right=(Num,"50",50) type='baal'
  15 | Variable type='num' name='championships' readOnly=undefined
  16 | PrintStatement argument=(Quote,""You are Kobe"")`;

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
