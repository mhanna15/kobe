import assert from "assert/strict";
import util from "util";
import ast from "../src/ast.js";

const source = `num x=5
                num job addFive(num x) {output x add 5}`;

const expected = `   1 | Program statements=[#2,#3]
   2 | VariableDeclaration type='num' variable=(Id,"x") initializer=(Num,"5")
   3 | FunctionDeclaration fun=#4 chunk=[#6]
   4 | Function returnType='num' id=(Id,"addFive") param=[#5]
   5 | Parameter type='num' name=(Id,"x")
   6 | returnStatement expression=#7
   7 | BinaryExpression op='add' left=(Id,"x") right=(Num,"5")`;

describe("The AST generator", () => {
  it("produces the expected AST for all node types", () => {
    assert.deepEqual(util.format(ast(source)), expected);
  });
});
