<script lang="ts">
  // ==========================================================================
  // File    : +page.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Document editor page with split-view layout for editing and preview.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import { fly, fade } from 'svelte/transition';
  import { Button } from '$lib/components/ui/button';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { EditorHeader, EditorPanel, PreviewPanel } from '$lib/components/editor';
  import Eye from '@lucide/svelte/icons/eye';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import Pencil from '@lucide/svelte/icons/pencil';
  import type { PageData } from './$types';

  // --------------------------------------------------------------------------
  // [SECTION] Props & State
  // --------------------------------------------------------------------------

  let { data }: { data: PageData } = $props();

  let showPreview = $state(true);
  let editorContent = $state('');
  let isSaving = $state(false);
  let lastSaved = $state<Date | null>(null);

  // --------------------------------------------------------------------------
  // [SECTION] Derived State
  // --------------------------------------------------------------------------

  let canEdit = $derived(data.canEdit);
  let isOwner = $derived(data.permission === 'owner');
</script>

<svelte:head>
  <title>{data.document.title} | MarkWrite</title>
</svelte:head>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Main Layout -->
<!-- -------------------------------------------------------------------------- -->

<div class="bg-background flex h-screen flex-col" in:fade={{ duration: 200 }}>
  <!-- -------------------------------------------------------------------------- -->
  <!-- [SECTION] Editor Header -->
  <!-- -------------------------------------------------------------------------- -->
  <EditorHeader
    title={data.document.title}
    {canEdit}
    {isOwner}
    {isSaving}
    {lastSaved}
    owner={data.document.owner}
    collaborators={data.collaborators}
  >
    {#snippet actions()}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button
            variant="ghost"
            size="icon"
            onclick={() => (showPreview = !showPreview)}
            class="h-9 w-9"
          >
            {#if showPreview}
              <EyeOff class="h-4 w-4" />
            {:else}
              <Eye class="h-4 w-4" />
            {/if}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          {showPreview ? 'Hide preview' : 'Show preview'}
        </Tooltip.Content>
      </Tooltip.Root>
    {/snippet}
  </EditorHeader>

  <!-- -------------------------------------------------------------------------- -->
  <!-- [SECTION] Editor Content Area -->
  <!-- -------------------------------------------------------------------------- -->
  <main class="flex flex-1 overflow-hidden">
    <!-- Editor Panel -->
    <div class="border-border flex-1 overflow-auto border-r {showPreview ? 'w-1/2' : 'w-full'}">
      <EditorPanel
        bind:content={editorContent}
        readonly={!canEdit}
        placeholder={canEdit ? 'Start writing...' : 'This document is read-only'}
      />
    </div>

    <!-- Preview Panel -->
    {#if showPreview}
      <div
        class="bg-muted/30 w-1/2 overflow-auto"
        in:fly={{ x: 50, duration: 200 }}
        out:fly={{ x: 50, duration: 150 }}
      >
        <PreviewPanel content={editorContent} />
      </div>
    {/if}
  </main>

  <!-- -------------------------------------------------------------------------- -->
  <!-- [SECTION] Status Bar -->
  <!-- -------------------------------------------------------------------------- -->
  <footer
    class="border-border bg-muted/50 text-muted-foreground flex h-8 items-center justify-between border-t px-4 text-xs"
  >
    <div class="flex items-center gap-4">
      {#if !canEdit}
        <span class="flex items-center gap-1">
          <Eye class="h-3 w-3" />
          View only
        </span>
      {:else}
        <span class="flex items-center gap-1">
          <Pencil class="h-3 w-3" />
          Editing
        </span>
      {/if}
    </div>
    <div class="flex items-center gap-4">
      {#if lastSaved}
        <span>Saved {lastSaved.toLocaleTimeString()}</span>
      {/if}
      <span>{editorContent.length} characters</span>
    </div>
  </footer>
</div>
