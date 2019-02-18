import typescript from 'rollup-plugin-typescript';
import { uglify } from "rollup-plugin-uglify";

export default [
  {
    input: "theme-addresses.ts",
    output: {
      file: "dist/theme-addresses.cjs.js",
      format: "cjs"
    },
    plugins: [typescript()]
  },
  {
    input: "theme-addresses.ts",
    output: {
      file: "dist/theme-addresses.js",
      format: "iife",
      name: "Shopify.theme.addresses"
    },
    plugins: [typescript()]
  },
  {
    input: "theme-addresses.ts",
    output: {
      file: "dist/theme-addresses.min.js",
      format: "iife",
      name: "Shopify.theme.addresses"
    },
    plugins: [typescript(), uglify()]
  }
];
