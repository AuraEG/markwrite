<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  interface Props {
    placeholder?: string;
    class?: string;
  }

  let { placeholder, class: className }: Props = $props();
</script>

<SelectPrimitive.Value
  class={cn("text-sm", className)}
  {placeholder}
/>
