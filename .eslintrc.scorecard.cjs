const tsconfig = "./tsconfig.eslint.json";

module.exports = {
  extends: ["./.eslintrc"],
  parserOptions: {
    project: tsconfig,
    tsconfigRootDir: __dirname,
  },
  overrides: [
    {
      files: ["*.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        project: tsconfig,
        tsconfigRootDir: __dirname,
        extraFileExtensions: [".svelte"],
      },
    },
  ],
  rules: {
    "@typescript-eslint/no-floating-promises": "warn",
    "@typescript-eslint/no-misused-promises": "warn",
    "@typescript-eslint/no-redundant-type-constituents": "warn",
    "@typescript-eslint/no-unnecessary-condition": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-declaration-merging": "warn",
    "@typescript-eslint/no-unsafe-enum-comparison": "warn",
    "@typescript-eslint/no-unsafe-function-type": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/no-unsafe-unary-minus": "warn",
    "no-restricted-globals": [
      "warn",
      {
        name: "document",
        message:
          "Use activeDocument instead of document for Obsidian popout window compatibility.",
      },
    ],
  },
};
