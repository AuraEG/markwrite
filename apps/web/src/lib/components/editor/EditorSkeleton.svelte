<script lang="ts">
  // ==========================================================================
  // File    : EditorSkeleton.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Loading skeleton for the document editor page.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Editor Loading Skeleton -->
<!-- -------------------------------------------------------------------------- -->

<div class="bg-background flex h-screen animate-pulse flex-col">
  <!-- Header Skeleton -->
  <header class="border-border flex h-14 items-center justify-between border-b px-4">
    <div class="flex items-center gap-3">
      <Skeleton class="h-9 w-9 rounded-md" />
      <Skeleton class="h-6 w-48" />
    </div>
    <div class="flex items-center gap-1">
      <Skeleton class="h-8 w-8 rounded-full" />
      <Skeleton class="-ml-2 h-8 w-8 rounded-full" />
    </div>
    <div class="flex items-center gap-1">
      <Skeleton class="h-9 w-9 rounded-md" />
      <Skeleton class="h-9 w-9 rounded-md" />
      <Skeleton class="h-9 w-9 rounded-md" />
    </div>
  </header>

  <!-- Content Skeleton -->
  <main class="flex flex-1 overflow-hidden">
    <!-- Editor Panel Skeleton -->
    <div class="border-border w-1/2 border-r p-6">
      <div class="space-y-4">
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-4/5" />
        <Skeleton class="h-4 w-1/2" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-3/4" />
      </div>
    </div>

    <!-- Preview Panel Skeleton -->
    <div class="bg-muted/30 w-1/2 p-6">
      <div class="space-y-4">
        <Skeleton class="h-8 w-1/2" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-4 w-4/5" />
        <Skeleton class="mt-4 h-6 w-2/5" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-3/4" />
      </div>
    </div>
  </main>

  <!-- Status Bar Skeleton -->
  <footer class="border-border bg-muted/50 flex h-8 items-center justify-between border-t px-4">
    <Skeleton class="h-3 w-20" />
    <Skeleton class="h-3 w-32" />
  </footer>
</div>
