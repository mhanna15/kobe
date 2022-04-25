import assert from "assert/strict";
import util from "util";
import ast from "../src/ast.js";

const source = `num x=5
                quote pass = "X is greater that 10"
                quote fail = "X is less than 11"
                
                num job addFive(num x) {output x add 5}
                
                coil (num i, 0 to 5) { addFive(x) }

                if (x > 10) { print(pass) } elif (x < 11) { print(fail) }

                grindUntil(sqrt(x) < 5) { x = x minus 1 }

                reps(5) { x = x add 1 }
                `;

const expected = `   1 | Program statements=[#2,#3,#4,#5,#10,#15,#21,#26]
   2 | VariableDeclaration type='num' variable=(Id,"x") initializer=(Num,"5")
   3 | VariableDeclaration type='quote' variable=(Id,"pass") initializer=(Quote,""X is greater that 10"")
   4 | VariableDeclaration type='quote' variable=(Id,"fail") initializer=(Quote,""X is less than 11"")
   5 | FunctionDeclaration fun=#6 chunk=[#8]
   6 | Function returnType='num' id=(Id,"addFive") param=[#7]
   7 | Parameter type='num' name=(Id,"x")
   8 | OutputStatement expression=#9
   9 | BinaryExpression op='add' left=(Id,"x") right=(Num,"5")
  10 | CoilStatement Until=#11 Chunk=[#14]
  11 | UntilRange Parameter=#12 Range=#13
  12 | Parameter type='num' name=(Id,"i")
  13 | Range Low=(Num,"0") High=(Num,"5")
  14 | Call callee=(Id,"addFive") args=[(Id,"x")]
  15 | IfStatement test=#16 chunk=[#17] alternate=[#18]
  16 | BinaryExpression op='>' left=(Id,"x") right=(Num,"10")
  17 | PrintStatement argument=(Id,"pass")
  18 | IfStatement test=#19 chunk=[#20] alternate=undefined
  19 | BinaryExpression op='<' left=(Id,"x") right=(Num,"11")
  20 | PrintStatement argument=(Id,"fail")
  21 | GrindUntilStatement Condition=#22 Chunk=[#24]
  22 | BinaryExpression op='<' left=#23 right=(Num,"5")
  23 | UnaryExpression op='sqrt' operand=(Id,"x")
  24 | Reassignment target=(Id,"x") source=#25
  25 | BinaryExpression op='minus' left=(Id,"x") right=(Num,"1")
  26 | RepeatStatement count=(Num,"5") chunk=[#27]
  27 | Reassignment target=(Id,"x") source=#28
  28 | BinaryExpression op='add' left=(Id,"x") right=(Num,"1")`;
describe("The AST generator", () => {
  it("produces the expected AST for all node types", () => {
    assert.deepEqual(util.format(ast(source)), expected);
  });
});
