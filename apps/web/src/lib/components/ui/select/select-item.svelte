<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";
  import Check from "@lucide/svelte/icons/check";

  interface Props {
    value: string;
    label?: string;
    class?: string;
  }

  let { value, label, class: className }: Props = $props();
  
  // [*] Use label if provided, otherwise capitalize the value
  let displayLabel = $derived(label || value.charAt(0).toUpperCase() + value.slice(1));
</script>

<SelectPrimitive.Item
  {value}
  label={displayLabel}
  class={cn(
    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className
  )}
>
  {#snippet children({ isSelected })}
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {#if isSelected}
        <Check class="h-4 w-4" />
      {/if}
    </span>
    {displayLabel}
  {/snippet}
</SelectPrimitive.Item>
