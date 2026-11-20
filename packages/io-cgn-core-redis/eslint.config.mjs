import pagopa from "@pagopa/eslint-config";

export default [
  ...pagopa,
  {
    ignores: ["**/__tests__/**", "*.config*", "**/dist/**", "**/node_modules/**"],
  },
];
