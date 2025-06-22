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
    "require-jsdoc": "off",
    "object-curly-spacing": "off", // 중괄호 공백 규칙 비활성화
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
};
