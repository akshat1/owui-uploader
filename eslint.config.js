const js = require("@eslint/js");
const globals = require("globals");
const stylistic = require("@stylistic/eslint-plugin");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType : "module",
      globals    : {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      // I probably went more nuts than usual because I have just discovered stylistic.
      // Could it possibly be our salvation from Shittier? Maybe there's hope yet. 
      "@stylistic/indent"                     : ["error", 2],
      "@stylistic/comma-dangle"               : ["error", "always-multiline"],
      "@stylistic/comma-spacing"              : ["error", { "before": false, "after": true }],
      "@stylistic/comma-style"                : ["error", "last"],
      "@stylistic/semi"                       : ["error", "always"],
      "@stylistic/quotes"                     : ["error", "double"],
      "@stylistic/object-curly-spacing"       : ["error", "always"],
      "@stylistic/array-bracket-spacing"      : ["error", "never"],
      "@stylistic/arrow-spacing"              : ["error", { "before": true, "after": true }],
      "@stylistic/space-before-function-paren": ["error", "never"],
      "@stylistic/space-in-parens"            : ["error", "never"],
      "@stylistic/space-infix-ops"            : ["error", { "int32Hint": false }],
      "@stylistic/space-unary-ops"            : ["error", { "words": true, "nonwords": false }],
      "@stylistic/wrap-regex"                 : "error",
      "@stylistic/key-spacing"                : ["error", { align: "colon" }],
      "@/no-debugger"                         : "error",
      "@/switch-colon-spacing"                : ["error", { "after": true, "before": false }],
      "sort-imports"                          : "error",
      "no-unused-vars"                        : "warn",
      "@/brace-style"                         : ["error", "1tbs"],
      "@/max-statements-per-line"             : ["error", { "max": 1 }],
      "@/multiline-comment-style"             : ["error", "separate-lines"],
      "@/multiline-ternary"                   : ["error", "never"],
    },
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
    ],
  },
];