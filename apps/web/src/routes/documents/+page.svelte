<script lang="ts">
  // ==========================================================================
  // File    : +page.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Documents list page - displays user's documents with full CRUD.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import { invalidateAll } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Navbar } from '$lib/components/layout';
  import {
    DocumentCard,
    EmptyState,
    CreateDocumentDialog,
    RenameDocumentDialog,
    DeleteDocumentDialog,
  } from '$lib/components/documents';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import { Input } from '$lib/components/ui/input';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  let { data } = $props();

  // --------------------------------------------------------------------------
  // [SECTION] State
  // --------------------------------------------------------------------------

  let createDialogOpen = $state(false);
  let renameDialogOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let selectedDocument = $state<(typeof data.documents)[0] | null>(null);
  let isCreating = $state(false);
  let isRenaming = $state(false);
  let isDeleting = $state(false);
  let searchQuery = $state('');

  // --------------------------------------------------------------------------
  // [SECTION] Derived State
  // --------------------------------------------------------------------------

  const filteredDocuments = $derived(
    data.documents.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --------------------------------------------------------------------------
  // [SECTION] Actions
  // --------------------------------------------------------------------------

  async function createDocument(title: string) {
    isCreating = true;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        createDialogOpen = false;
        // [*] Navigate to new document editor (once it exists)
        // For now, refresh the list
        await invalidateAll();
      }
    } finally {
      isCreating = false;
    }
  }

  async function renameDocument(title: string) {
    if (!selectedDocument) return;
    isRenaming = true;
    try {
      const res = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        renameDialogOpen = false;
        await invalidateAll();
      }
    } finally {
      isRenaming = false;
    }
  }

  async function deleteDocument() {
    if (!selectedDocument) return;
    isDeleting = true;
    try {
      const res = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        deleteDialogOpen = false;
        await invalidateAll();
      }
    } finally {
      isDeleting = false;
    }
  }

  function handleRename(id: string) {
    selectedDocument = data.documents.find((d) => d.id === id) ?? null;
    renameDialogOpen = true;
  }

  function handleDelete(id: string) {
    selectedDocument = data.documents.find((d) => d.id === id) ?? null;
    deleteDialogOpen = true;
  }

  function handleShare(id: string) {
    // TODO: Implement share functionality
    console.log('Share:', id);
  }
</script>

<svelte:head>
  <title>My Documents | MarkWrite</title>
</svelte:head>

<div class="bg-background min-h-screen">
  <Navbar user={data.user} />

  <main class="container mx-auto max-w-6xl px-4 py-8">
    <!-- -------------------------------------------------------------------------- -->
    <!-- [SECTION] Page Header -->
    <!-- -------------------------------------------------------------------------- -->
    <div
      class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      in:fly={{ y: -20, duration: 300, easing: cubicOut }}
    >
      <div>
        <h1 class="text-3xl font-bold tracking-tight">My Documents</h1>
        <p class="text-muted-foreground mt-1">
          {data.documents.length}
          {data.documents.length === 1 ? 'document' : 'documents'}
        </p>
      </div>

      <div class="flex items-center gap-3">
        {#if data.documents.length > 0}
          <div class="relative" in:fade={{ duration: 200 }}>
            <Search
              class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            />
            <Input
              bind:value={searchQuery}
              placeholder="Search documents..."
              class="w-full pl-9 sm:w-64"
            />
          </div>
        {/if}

        <Button onclick={() => (createDialogOpen = true)} class="shadow-primary/20 gap-2 shadow-lg">
          <Plus class="h-4 w-4" />
          <span class="hidden sm:inline">New Document</span>
          <span class="sm:hidden">New</span>
        </Button>
      </div>
    </div>

    <!-- -------------------------------------------------------------------------- -->
    <!-- [SECTION] Documents Grid or Empty State -->
    <!-- -------------------------------------------------------------------------- -->
    {#if data.documents.length === 0}
      <EmptyState onCreate={() => (createDialogOpen = true)} loading={isCreating} />
    {:else if filteredDocuments.length === 0}
      <div
        class="flex min-h-[300px] flex-col items-center justify-center text-center"
        in:fade={{ duration: 200 }}
      >
        <Search class="text-muted-foreground/50 mb-4 h-12 w-12" />
        <h3 class="text-lg font-medium">No documents found</h3>
        <p class="text-muted-foreground mt-1">
          No documents match "{searchQuery}"
        </p>
        <Button variant="link" onclick={() => (searchQuery = '')} class="mt-2">Clear search</Button>
      </div>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each filteredDocuments as document, i (document.id)}
          <DocumentCard
            {document}
            index={i}
            onRename={handleRename}
            onDelete={handleDelete}
            onShare={handleShare}
          />
        {/each}
      </div>
    {/if}
  </main>
</div>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Dialogs -->
<!-- -------------------------------------------------------------------------- -->
<CreateDocumentDialog bind:open={createDialogOpen} loading={isCreating} onCreate={createDocument} />

<RenameDocumentDialog
  bind:open={renameDialogOpen}
  loading={isRenaming}
  currentTitle={selectedDocument?.title ?? ''}
  onRename={renameDocument}
/>

<DeleteDocumentDialog
  bind:open={deleteDialogOpen}
  loading={isDeleting}
  documentTitle={selectedDocument?.title}
  onConfirm={deleteDocument}
/>
