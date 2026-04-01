<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { themeStore } from '$lib/stores/theme.svelte';

  let { children } = $props();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ToasterComponent: any = $state(null);

  onMount(async () => {
    // Initialize theme store
    themeStore.initialize();

    if (browser) {
      const module = await import('svelte-sonner');
      ToasterComponent = module.Toaster;
    }
  });
</script>

<svelte:head>
  <title>MarkWrite</title>
</svelte:head>

{@render children()}

{#if ToasterComponent}
  {@const Component = ToasterComponent}
  <Component position="top-right" theme={themeStore.resolvedTheme} />
{/if}
