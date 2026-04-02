<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import type { Snippet } from "svelte";

  interface Props {
    value?: string;
    children?: Snippet;
  }

  let { value = $bindable(), children }: Props = $props();
</script>

<SelectPrimitive.Root type="single" bind:value>
  {#if children}
    {@render children()}
  {/if}
</SelectPrimitive.Root>
