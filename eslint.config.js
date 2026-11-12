const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'constants/tokens/palette.ts'],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/constants/colors',
              message:
                'Prefer useTheme() from @/hooks/useTheme. constants/colors is a legacy shim.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
          message:
            'Raw hex colors belong in constants/tokens/palette.ts. Use useTheme() in components.',
        },
        {
          selector:
            'Property[key.name="fontSize"][value.type="Literal"][value.value!=null]',
          message:
            'Prefer Text variants from @/components/ui/Text instead of literal fontSize.',
        },
      ],
    },
  },
  {
    // The Focus'd design-system primitives define the type scale and use the
    // tokens in constants/focusd.ts directly, like constants/tokens/palette.ts.
    files: ['components/fd/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
