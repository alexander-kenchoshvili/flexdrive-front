import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    "no-console": "off",
    "no-useless-assignment": "off",
    "vue/attributes-order": "off",
    "vue/html-self-closing": "off",
    "vue/multi-word-component-names": "off",
    "vue/no-multiple-template-root": "off",
    "vue/no-required-prop-with-default": "off",
    "vue/no-v-html": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-invalid-void-type": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/unified-signatures": "off",
    "nuxt/prefer-import-meta": "off",
  },
});
