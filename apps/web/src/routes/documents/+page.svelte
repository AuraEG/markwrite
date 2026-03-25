<script lang="ts" module>
  async function createDocument() {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (res.ok) {
      // [*] Reload page to show new document in list
      // TODO: Navigate to editor once /documents/[id] route exists
      window.location.reload();
    }
  }
</script>

<script lang="ts">
  // ==========================================================================
  // File    : +page.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Documents list page - displays user's documents.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';

  let { data } = $props();
</script>

<svelte:head>
  <title>My Documents | MarkWrite</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <!-- -------------------------------------------------------------------------- -->
  <!-- [SECTION] Page Header -->
  <!-- -------------------------------------------------------------------------- -->
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">My Documents</h1>
      <p class="text-muted-foreground">Welcome back, {data.user?.username}</p>
    </div>
    <Button onclick={() => createDocument()}>+ New Document</Button>
  </div>

  <!-- -------------------------------------------------------------------------- -->
  <!-- [SECTION] Documents Grid (Placeholder) -->
  <!-- -------------------------------------------------------------------------- -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card.Root
      class="hover:border-primary flex h-48 cursor-pointer items-center justify-center border-dashed"
    >
      <Card.Content class="text-center">
        <p class="text-muted-foreground">+ Create your first document</p>
      </Card.Content>
    </Card.Root>
  </div>
</div>
