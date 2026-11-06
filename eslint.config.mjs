// ESLint 9 flat config: Airbnb (via eslint-config-airbnb-extended) + TypeScript + Prettier.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { configs, plugins } from 'eslint-config-airbnb-extended';

export default [
  { ignores: ['**/node_modules/**', '**/.next/**', '**/out/**', '**/dist/**', '**/coverage/**'] },
  { name: 'js/recommended', ...js.configs.recommended },
  plugins.stylistic,
  plugins.importX,
  ...configs.base.recommended,
  plugins.typescriptEslint,
  ...configs.base.typescript,
  {
    name: 'creditq/overrides',
    rules: {
      // Named exports keep the core API explicit and tree-shakeable.
      'import-x/prefer-default-export': 'off',
      // `for...of` over small arrays is clearer than reduce chains in the planner.
      'no-restricted-syntax': [
        'error',
        { selector: 'ForInStatement', message: 'Use Object.keys/entries with for...of.' },
        { selector: 'LabeledStatement', message: 'Labels are hard to follow.' },
        { selector: 'WithStatement', message: '`with` is not allowed.' },
      ],
      // Loop counters in date arithmetic.
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    },
  },
  {
    name: 'creditq/core-purity',
    files: ['packages/core/src/**/*.ts'],
    rules: {
      // Core must be deterministic: no ambient clock, no DOM, no locale-dependent APIs.
      'no-restricted-globals': ['error', 'window', 'document', 'indexedDB', 'localStorage', 'Intl'],
      'no-restricted-properties': [
        'error',
        { object: 'Date', property: 'now', message: 'Inject `today` instead.' },
        { object: 'Math', property: 'random', message: 'Core must be deterministic.' },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: 'Use CivilDate, not Date.' },
        { selector: 'ForInStatement', message: 'Use Object.keys/entries with for...of.' },
      ],
    },
  },
  {
    name: 'creditq/tests',
    files: ['**/test/**/*.ts', '**/*.test.ts', '**/vitest.config.ts'],
    rules: {
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
  prettier,
];
