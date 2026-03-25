// ==========================================================================
// File    : eslint.config.js
// Project : MarkWrite Web
// Purpose : ESLint flat configuration for SvelteKit + TypeScript.
// ==========================================================================

import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: ts.parser
      }
    }
  },
  {
    rules: {
      // [*] Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // [*] Allow any for migration period
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    // [*] Allow @html in preview components (needed for Markdown rendering)
    files: ['**/PreviewPanel.svelte'],
    rules: {
      'svelte/no-at-html-tags': 'off'
    }
  },
  {
    ignores: [
      '.svelte-kit/**',
      '.vercel/**',
      'build/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'src/lib/components/ui/**' // [*] shadcn-svelte generated components
    ]
  }
];
