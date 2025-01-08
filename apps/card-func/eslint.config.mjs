import pagopa from "@pagopa/eslint-config";

export default [
  ...pagopa,
  {
    ignores: [
      "**/__tests__/**",
      "*.config*",
      "**/dist/**",
      "**/generated/**",
      "**/node_modules/**",
    ],
  },
];
