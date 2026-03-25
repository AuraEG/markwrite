<script lang="ts">
  // ==========================================================================
  // File    : EmptyState.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Empty state component for when user has no documents.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import { Button } from '$lib/components/ui/button';
  import FileText from '@lucide/svelte/icons/file-text';
  import Plus from '@lucide/svelte/icons/plus';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import { scale, fade } from 'svelte/transition';
  import { elasticOut } from 'svelte/easing';

  interface Props {
    onCreate?: () => void;
    loading?: boolean;
  }

  let { onCreate, loading = false }: Props = $props();
</script>

<div
  class="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center"
  in:fade={{ duration: 300 }}
>
  <div
    class="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
    in:scale={{ duration: 500, delay: 100, easing: elasticOut }}
  >
    <FileText class="text-primary h-10 w-10" />
  </div>

  <h3 class="mb-2 text-xl font-semibold" in:fade={{ duration: 300, delay: 200 }}>
    No documents yet
  </h3>

  <p class="text-muted-foreground mb-6 max-w-sm" in:fade={{ duration: 300, delay: 300 }}>
    Create your first document to start writing. Your documents are automatically saved and synced.
  </p>

  <div in:scale={{ duration: 400, delay: 400, easing: elasticOut }}>
    <Button onclick={onCreate} size="lg" disabled={loading} class="gap-2">
      {#if loading}
        <div
          class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        ></div>
        Creating...
      {:else}
        <Plus class="h-5 w-5" />
        Create your first document
        <Sparkles class="ml-1 h-4 w-4" />
      {/if}
    </Button>
  </div>
</div>
