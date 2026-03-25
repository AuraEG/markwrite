import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { codecovSvelteKitPlugin } from '@codecov/sveltekit-plugin';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    codecovSvelteKitPlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: 'markwrite-web',
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      all: false,
      exclude: [
        'node_modules/**',
        '.svelte-kit/**',
        'src/lib/components/ui/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/*.svelte',
      ],
    },
  },
});
