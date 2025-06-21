module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
    "max-len": ["error", {"code": 120}],
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
};