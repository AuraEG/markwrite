<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn, flyAndScale } from "$lib/utils.js";
  import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className, children }: Props = $props();
</script>

<SelectPrimitive.Content
  transition={flyAndScale}
  class={cn(
    "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
    className
  )}
>
  <div class="w-full p-1">
    {#if children}
      {@render children()}
    {/if}
  </div>
</SelectPrimitive.Content>
