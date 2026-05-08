import adapterVercel from '@sveltejs/adapter-vercel';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Use Vercel adapter when building on Vercel, Node adapter for other environments.
// `VERCEL_ENV` is included because some build pipelines do not expose `VERCEL=1`.
const isVercel = process.env.VERCEL === '1' || typeof process.env.VERCEL_ENV === 'string';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: isVercel
      ? adapterVercel({
          runtime: 'nodejs20.x',
          regions: ['iad1'], // US East (Virginia) - closest to typical users
          split: false // Keep as single function for simplicity
        })
      : adapterNode({
          // Increase body size limit to 10MB for large documents
          bodySizeLimit: 10 * 1024 * 1024
        }),
    alias: {
      $components: 'src/lib/components',
      $server: 'src/lib/server',
      $stores: 'src/lib/stores',
      $utils: 'src/lib/utils'
    }
  }
};

export default config;
