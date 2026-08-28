import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

const config = [
  // `.next-*` are the versioned release builds deploy-web.ps1 writes beside the
  // live one; they are generated output like `.next` and must not be linted.
  { ignores: [".next/**", ".next-*/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
];

export default config;
