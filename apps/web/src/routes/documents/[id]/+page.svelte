<script lang="ts">
  // ==========================================================================
  // File    : +page.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Document editor page with split-view layout for editing and preview.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // Updated : 2026-03-27 - Added optional real-time collaboration toggle
  // Updated : 2026-04-02 - Added user settings integration
  // ==========================================================================

  import { fly, fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { EditorHeader, EditorPanel, PreviewPanel } from '$lib/components/editor';
  import CollaboratorsList from '$lib/components/editor/CollaboratorsList.svelte';
  import ShareDialog from '$lib/components/editor/ShareDialog.svelte';
  import { saveDocumentState } from '$lib/collaboration';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import Eye from '@lucide/svelte/icons/eye';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Cloud from '@lucide/svelte/icons/cloud';
  import CloudOff from '@lucide/svelte/icons/cloud-off';
  import Users from '@lucide/svelte/icons/users';
  import Wifi from '@lucide/svelte/icons/wifi';
  import WifiOff from '@lucide/svelte/icons/wifi-off';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import type { PageData } from './$types';

  // --------------------------------------------------------------------------
  // [SECTION] Props & State
  // --------------------------------------------------------------------------

  let { data }: { data: PageData } = $props();

  let showPreview = $state(true);
  let markdownContent = $state('');
  let isSaving = $state(false);
  let lastSaved = $state<Date | null>(null);
  let saveError = $state<string | null>(null);
  let syncStatus = $state<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  let collaborationEnabled = $state(false);
  let editorKey = $state(0);
  let collaborators = $state<Array<{ id: string; username: string }>>([]);
  let showShareDialog = $state(false);

  // --------------------------------------------------------------------------
  // [SECTION] Lifecycle
  // --------------------------------------------------------------------------

  onMount(async () => {
    // [*] Load user settings
    await settingsStore.loadSettings();
  });

  // --------------------------------------------------------------------------
  // [SECTION] Derived State
  // --------------------------------------------------------------------------

  let canEdit = $derived(data.canEdit);
  let isOwner = $derived(data.permission === 'owner');

  // --------------------------------------------------------------------------
  // [SECTION] Handlers
  // --------------------------------------------------------------------------

  function handleContentUpdate(content: string) {
    markdownContent = content;
  }

  async function handleStateUpdate(state: string) {
    if (!canEdit) return;

    isSaving = true;
    saveError = null;

    const result = await saveDocumentState(data.document.id, state);

    isSaving = false;

    if (result.success) {
      lastSaved = new Date();
    } else {
      saveError = result.error ?? 'Failed to save';
      console.error('[Editor] Save failed:', result.error);
    }
  }

  function handleSyncStatusChange(status: 'connecting' | 'connected' | 'disconnected' | 'error') {
    syncStatus = status;
  }

  function toggleCollaboration() {
    collaborationEnabled = !collaborationEnabled;
    // [*] Update status before re-rendering
    if (collaborationEnabled) {
      syncStatus = 'connecting';
    } else {
      syncStatus = 'disconnected';
      collaborators = [];
    }
    // [*] Force re-render of EditorPanel to reconnect/disconnect
    editorKey++;
  }

  function handleCollaboratorsChange(newCollaborators: Array<{ id: string; username: string }>) {
    collaborators = newCollaborators;
  }
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
    documentId={data.document.id}
    {canEdit}
    {isOwner}
    {isSaving}
    {lastSaved}
    owner={data.document.owner}
    collaborators={data.collaborators}
    onExportHtml={() => markdownContent}
    onExportMarkdown={() => markdownContent}
    onShare={() => (showShareDialog = true)}
  >
    {#snippet actions()}
      <!-- Online Collaborators -->
      {#if collaborationEnabled && collaborators.length > 0}
        <CollaboratorsList {collaborators} />
      {/if}

      <!-- Collaboration Toggle -->
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            variant={syncStatus === 'connected' ? 'default' : 'ghost'}
            size="sm"
            onclick={toggleCollaboration}
            class="h-9 gap-2 {syncStatus === 'connected' ? 'bg-green-600 hover:bg-green-700' : ''}"
          >
            <Users class="h-4 w-4" />
            {#if syncStatus === 'connecting'}
              <span class="text-xs">Connecting...</span>
            {:else if syncStatus === 'connected'}
              <span class="text-xs">Live</span>
            {:else}
              <span class="text-xs">Collaborate</span>
            {/if}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          {collaborationEnabled
            ? 'Disable real-time collaboration'
            : 'Enable real-time collaboration'}
        </Tooltip.Content>
      </Tooltip.Root>

      <!-- Preview Toggle -->
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
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
  <main class="flex flex-1 flex-col overflow-hidden md:flex-row">
    <!-- Editor Panel -->
    <div
      class="border-border flex-1 overflow-auto {showPreview
        ? 'h-1/2 border-b md:h-full md:w-1/2 md:border-b-0 md:border-r'
        : 'h-full w-full'}"
    >
      {#key editorKey}
        <EditorPanel
          documentId={data.document.id}
          initialState={data.document.yjsState}
          readonly={!canEdit}
          placeholder={canEdit ? 'Start writing markdown...' : 'This document is read-only'}
          enableRealTimeSync={collaborationEnabled}
          currentUserId={data.user?.id}
          currentUsername={data.user?.username}
          onContentUpdate={handleContentUpdate}
          onStateUpdate={handleStateUpdate}
          onSyncStatusChange={handleSyncStatusChange}
          onCollaboratorsChange={handleCollaboratorsChange}
        />
      {/key}
    </div>

    <!-- Preview Panel -->
    {#if showPreview}
      <div
        class="bg-muted/30 h-1/2 overflow-auto md:h-full md:w-1/2"
        in:fly={{ x: 50, duration: 200 }}
        out:fly={{ x: 50, duration: 150 }}
      >
        <PreviewPanel
          content={markdownContent}
          showLineNumbers={settingsStore.settings.showLineNumbers}
        />
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

      <!-- Sync Status (only show when collaboration is enabled) -->
      {#if collaborationEnabled}
        {#if syncStatus === 'connecting'}
          <span class="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
            <Loader2 class="h-3 w-3 animate-spin" />
            Connecting...
          </span>
        {:else if syncStatus === 'connected'}
          <span class="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Wifi class="h-3 w-3" />
            Live
          </span>
        {:else if syncStatus === 'error'}
          <span class="text-destructive flex items-center gap-1">
            <WifiOff class="h-3 w-3" />
            Sync error
          </span>
        {:else}
          <span class="flex items-center gap-1">
            <WifiOff class="h-3 w-3" />
            Offline
          </span>
        {/if}
      {/if}

      <!-- Save Status -->
      {#if saveError}
        <span class="text-destructive flex items-center gap-1">
          <CloudOff class="h-3 w-3" />
          {saveError}
        </span>
      {:else if isSaving}
        <span class="flex items-center gap-1">
          <Cloud class="h-3 w-3 animate-pulse" />
          Saving...
        </span>
      {:else if lastSaved}
        <span class="flex items-center gap-1 text-green-600 dark:text-green-400">
          <Cloud class="h-3 w-3" />
          Saved
        </span>
      {/if}
    </div>
    <div class="flex items-center gap-4">
      {#if lastSaved}
        <span>Last saved {lastSaved.toLocaleTimeString()}</span>
      {/if}
    </div>
  </footer>
</div>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] ShareDialog -->
<!-- -------------------------------------------------------------------------- -->
<ShareDialog
  bind:open={showShareDialog}
  documentId={data.document.id}
  {isOwner}
  initialIsPublic={data.document.isPublic}
  initialShareToken={data.document.shareToken}
  initialGistUrl={data.document.gistUrl}
/>
