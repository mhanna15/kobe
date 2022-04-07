import assert from "assert/strict";
import util from "util";
import ast from "../src/ast.js";

const source = `num x=5
                quote done = "X is greater that 10"
                num job addFive(num x) {output x add 5}
                
                coil (num i, 0 to 5) { addFive(x) }

                if (x > 10) { print(done) }
                `;

const expected = `   1 | Program statements=[#2,#3,#8]
   2 | VariableDeclaration type='num' variable=(Id,"x") initializer=(Num,"5")
   3 | FunctionDeclaration fun=#4 chunk=[#6]
   4 | Function returnType='num' id=(Id,"addFive") param=[#5]
   5 | Parameter type='num' name=(Id,"x")
   6 | returnStatement expression=#7
   7 | BinaryExpression op='add' left=(Id,"x") right=(Num,"5")
   8 | CoilStatement Until=#9 Chunk=[#12]
   9 | UntilRange Parameter=#10 Range=#11
  10 | Parameter type='num' name=(Id,"i")
  11 | Range Low=(Num,"0") High=(Num,"5")
  12 | Call callee=(Id,"addFive") args=[(Id,"x")]`;

describe("The AST generator", () => {
  it("produces the expected AST for all node types", () => {
    assert.deepEqual(util.format(ast(source)), expected);
  });
});
