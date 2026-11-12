const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'server_dist/*'],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
          message: 'Raw hex colours belong in constants/theme.ts. Use useZ() for theme colours.',
        },
        {
          selector: 'Property[key.name="fontSize"][value.type="Literal"][value.value!=null]',
          message: 'Use a T variant from components/z/ui.tsx or a size from FS in constants/theme.ts.',
        },
      ],
    },
  },
]);
