const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      // TODO: quitar este ignore cuando se corrija el error de sintaxis (TS1005) de misiones.spec.ts
      'src/app/paginas/misiones/misiones.spec.ts',
      'src/test/**',
      '**/*.html',
    ],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      '@typescript-eslint/no-unused-vars': ['warn'],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', '../../*', '../../../*', '../../../../*'],
              message:
                "Usá los path aliases (@app, @compartidos, @modelos, @servicios, @paginas, @svgs, @environments) en lugar de imports relativos '../'. Ver context.md, sección 5.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    rules: {},
  },
];