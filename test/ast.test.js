import assert from "assert/strict";
import util from "util";
import ast from "../src/ast.js";

const source = `x=5
                job addFive(num x){output x add 5}`;

const expected = `   1 | Program statements=[#2,#4,#6]
   2 | VariableDeclaration variable=(Id,"x") initializer=#3
   3 | FunctionDeclaration fun=(Id,"job") params=[(Id,"x")] body=#5
   4 | BinaryExpression op=(Sym,"*") left=(Num,"3") right=(Id,"x")
   6 | Assignment target=(Id,"x") source=(Num,"3")
   7 | PrintStatement argument=#9
   8 | Conditional test=(Num,"0") consequent=#10 alternate=(Num,"2")
   9 | Call callee=(Id,"f") args=[(Id,"x")]`;

describe("The AST generator", () => {
  it("produces the expected AST for all node types", () => {
    assert.deepEqual(util.format(ast(source)), expected);
  });
});
