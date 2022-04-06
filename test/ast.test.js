import assert from "assert/strict";
import util from "util";
import ast from "../src/ast.js";

const source = `num x=5
                num job addFive(num x) {output x add 5}`;

const expected = `   1 | Program statements=[#2,#3]
   2 | VariableDeclaration type='num' variable=(Id,"x") initializer=(Num, "5")
   3 | FunctionDeclaration fun=#4 body=
   4 | Function id=(Id,"addFive") param=[#5] returnType='num'
   5 | Paramerter type='num' name=(Id,"x")
   6 | Assignment target=(Id,"x") source=(Num,"3")
   7 | PrintStatement argument=#9
   8 | Conditional test=(Num,"0") consequent=#10 alternate=(Num,"2")
   9 | Call callee=(Id,"f") args=[(Id,"x")]`;

describe("The AST generator", () => {
  it("produces the expected AST for all node types", () => {
    assert.deepEqual(util.format(ast(source)), expected);
  });
});
