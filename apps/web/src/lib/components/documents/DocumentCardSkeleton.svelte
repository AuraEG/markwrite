<script lang="ts">
  // ==========================================================================
  // File    : DocumentCardSkeleton.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Loading skeleton for document cards.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import * as Card from '$lib/components/ui/card';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { fade } from 'svelte/transition';

  interface Props {
    count?: number;
  }

  let { count = 6 }: Props = $props();
</script>

{#each Array(count) as _, i}
  <div in:fade={{ duration: 200, delay: i * 50 }}>
    <Card.Root class="animate-pulse">
      <Card.Header class="pb-3">
        <div class="flex items-start gap-3">
          <Skeleton class="h-10 w-10 rounded-lg" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-5 w-3/4" />
            <Skeleton class="h-3 w-1/4" />
          </div>
        </div>
      </Card.Header>
      <Card.Footer class="pt-0">
        <Skeleton class="h-3 w-1/3" />
      </Card.Footer>
    </Card.Root>
  </div>
{/each}
