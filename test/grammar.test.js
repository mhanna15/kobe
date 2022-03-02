import assert from "assert/strict";
import fs from "fs";
import ohm from "ohm-js";

const syntaxChecks = [
    ["simplest syntactically correct program", "num x=5"],
    ["multiple statements", "job shoot(num a) { } reps(5) {shoot(5)}"],
    ["variable declarations", 'baal e = true num x = 0 quote spaget = "pasta"'],
    ["function with no params, no return type", " job banana() {}"],
    ["all numeric literal forms", "print(8 multiply 89.123)"],
    [
        "complex expressions",
        "print(83 multiply ((((-((((13 divide 21)))))))) add 1 minus 0)",
    ],
    ["all unary operators", "print (-3) print (!false) sqrt(16)"],
    [
        "all binary operators",
        "print x and y or z multiply 1 divide 2 to the 3 add 4 < 5",
    ],
    [
        "all arithmetic operators",
        "x = ((-3) multiply 2 add 4 minus 7.33 multiply (5 to the (13 divide 2)))",
    ],
    ["all relational operators", "x = 1<(2<(3==(4!=(5 > (6>7)))))"],
    ["function with one param", "num job f(num x) {output x}"],
    ["function with two params", "job f(num x, baal y) {}"],
    ["function with no params + return type", "baal  f(): int {}"],
    //   ["function types in params", "function f(g: (int)->boolean) {}"],
    //   ["function types returned", "function f(): (int)->(int)->void {}"],
    //   ["array type for param", "function f(x: [[[boolean]]]) {}"],
    //   ["array type returned", "function f(): [[int]] {}"],
    //   ["assignments", "a--; c++; abc=9*3; a=1;"],
    //   ["complex var assignment", "c(5)[2] = 100;c.p.r=1;c.q(8)[2](1,1).z=1;"],
    //   ["complex var bumps", "c(5)[2]++;c.p.r++;c.q(8)[2](1,1).z--;"],
    //   ["call in statement", "let x = 1;\nf(100);\nprint(1);"],
    //   ["call in exp", "print(5 * f(x, y, 2 * y));"],
    //   ["short if", "if true { print(1); }"],
    //   ["longer if", "if true { print(1); } else { print(1); }"],
    //   ["even longer if", "if true { print(1); } else if false { print(1);}"],
    //   ["while with empty block", "while true {}"],
    //   ["while with one statement block", "while true { let x = 1; }"],
    //   ["repeat with long block", "repeat 2 { print(1);\nprint(2);print(3); }"],
    //   ["if inside loop", "repeat 3 { if true { print(1); } }"],
    //   ["for closed range", "for i in 2...9*1 {}"],
    //   ["for half-open range", "for i in 2..<9*1 {}"],
    //   ["for collection-as-id", "for i in things {}"],
    //   ["for collection-as-lit", "for i in [3,5,8] {}"],
    //   ["conditional", "return x?y:z?y:p;"],
    //   ["??", "return a ?? b ?? c ?? d;"],
    //   ["ors can be chained", "print(1 || 2 || 3 || 4 || 5);"],
    //   ["ands can be chained", "print(1 && 2 && 3 && 4 && 5);"],
    //   ["bitwise ops", "return (1|2|3) + (4^5^6) + (7&8&9);"],
    //   ["relational operators", "print(1<2||1<=2||1==2||1!=2||1>=2||1>2);"],
    //   ["shifts", "return 3 << 5 >> 8 << 13 >> 21;"],
    //   ["arithmetic", "return 2 * x + 3 / 5 - -1 % 7 ** 3 ** 3;"],
    //   ["length", "return #c; return #[1,2,3];"],
    //   ["boolean literals", "let x = false || true;"],
    //   ["all numeric literal forms", "print(8 * 89.123 * 1.3E5 * 1.3E+5 * 1.3E-5);"],
    //   ["empty array literal", "print(emptyArrayOf(int));"],
    //   ["nonempty array literal", "print([1, 2, 3]);"],
    //   ["some operator", "return some dog;"],
    //   ["no operator", "return no dog;"],
    //   ["parentheses", "print(83 * ((((((((-(13 / 21))))))))) + 1 - 0);"],
    //   ["variables in expression", "return r.p(3,1)[9]?.x?.y.z.p()(5)[1];"],
    //   ["more variables", "return c(3).p?.oh(9)[2][2].nope(1)[3](2);"],
    //   ["indexing array literals", "print([1,2,3][1]);"],
    //   ["member expression on string literal", `print("hello".append("there"));`],
    //   ["non-Latin letters in identifiers", "let コンパイラ = 100;"],
    //   ["a simple string literal", 'print("hello😉😬💀🙅🏽‍♀️—`");'],
    //   ["string literal with escapes", 'return "a\\n\\tbc\\\\de\\"fg";'],
    //   ["u-escape", 'print("\\u{a}\\u{2c}\\u{1e5}\\u{ae89}\\u{1f4a9}\\u{10ffe8}");'],
    //   ["end of program inside comment", "print(0); // yay"],
    //   ["comments with no text", "print(1);//\nprint(0);//"],
];

// // Programs with syntax errors that the parser will detect
// const syntaxErrors = [
//   ["non-letter in an identifier", "let ab😭c = 2;", /Line 1, col 7:/],
//   ["malformed number", "let x= 2.;", /Line 1, col 10:/],
//   ["a float with an E but no exponent", "let x = 5E * 11;", /Line 1, col 10:/],
//   ["a missing right operand", "print(5 -);", /Line 1, col 10:/],
//   ["a non-operator", "print(7 * ((2 _ 3));", /Line 1, col 15:/],
//   ["an expression starting with a )", "return );", /Line 1, col 8:/],
//   ["a statement starting with expression", "x * 5;", /Line 1, col 3:/],
//   ["an illegal statement on line 2", "print(5);\nx * 5;", /Line 2, col 3:/],
//   ["a statement starting with a )", "print(5);\n)", /Line 2, col 1:/],
//   ["an expression starting with a *", "let x = * 71;", /Line 1, col 9:/],
//   ["negation before exponentiation", "print(-2**2);", /Line 1, col 10:/],
//   ["mixing ands and ors", "print(1 && 2 || 3);", /Line 1, col 15:/],
//   ["mixing ors and ands", "print(1 || 2 && 3);", /Line 1, col 15:/],
//   ["associating relational operators", "print(1 < 2 < 3);", /Line 1, col 13:/],
//   ["while without braces", "while true\nprint(1);", /Line 2, col 1/],
//   ["if without braces", "if x < 3\nprint(1);", /Line 2, col 1/],
//   ["while as identifier", "let for = 3;", /Line 1, col 5/],
//   ["if as identifier", "let if = 8;", /Line 1, col 5/],
//   ["unbalanced brackets", "function f(): int[;", /Line 1, col 18/],
//   ["empty array without type", "print([]);", /Line 1, col 9/],
//   ["bad array literal", "print([1,2,]);", /Line 1, col 12/],
//   ["empty subscript", "print(a[]);", /Line 1, col 9/],
//   ["true is not assignable", "true = 1;", /Line 1, col 5/],
//   ["false is not assignable", "false = 1;", /Line 1, col 6/],
//   ["no-paren function type", "function f(g:int->int) {}", /Line 1, col 17/],
//   ["string lit with unknown escape", 'print("ab\\zcdef");', /col 11/],
//   ["string lit with newline", 'print("ab\\zcdef");', /col 11/],
//   ["string lit with quote", 'print("ab\\zcdef");', /col 11/],
//   ["string lit with code point too long", 'print("\\u{1111111}");', /col 17/],
// ]

const syntaxErrors = [
    ["non-letter in an identifier", "ab😭c = 2", /Line 1, col 3/],
    ["malformed number", "x= 2.", /Line 1, col 6/],
    ["missing curly brace", "reps(5) print(5)", /Line 1, col 7/],
    ["a missing right operand", "print(5 -", /Line 1, col 10/],
    ["a non-operator", "print(7 * ((2 _ 3)", /Line 1, col 15/],
    ["an expression starting with a )", "x = )", /Line 1, col 5/],
    ["a statement starting with expression", "x * 5", /Line 1, col 3/],
    ["an illegal statement on line 2", "print(5)\nx * 5;", /Line 2, col 3/],
    ["a statement starting with a )", "print(5)\n) * 5", /Line 2, col 1/],
    [
        "keyword, coil, not found",
        "coil(num i, 0 to 9){print(i)}",
        /Line 1, col 5/,
    ],
];

describe("The grammar", () => {
    const grammar = ohm.grammar(fs.readFileSync("src/kobe.ohm"));
    for (const [scenario, source] of syntaxChecks) {
        it(`properly specifies ${scenario}`, () => {
            assert(grammar.match(source).succeeded());
        });
    }
    for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
        it(`does not permit ${scenario}`, () => {
            const match = grammar.match(source);
            assert(!match.succeeded());
            assert(new RegExp(errorMessagePattern).test(match.message));
        });
    }
});
