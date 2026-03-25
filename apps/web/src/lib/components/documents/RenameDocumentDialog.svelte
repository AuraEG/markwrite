<script lang="ts">
  // ==========================================================================
  // File    : RenameDocumentDialog.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Dialog for renaming an existing document.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import Pencil from '@lucide/svelte/icons/pencil';

  interface Props {
    open?: boolean;
    loading?: boolean;
    currentTitle?: string;
    onOpenChange?: (open: boolean) => void;
    onRename?: (title: string) => void;
  }

  let {
    open = $bindable(false),
    loading = false,
    currentTitle = '',
    onOpenChange,
    onRename,
  }: Props = $props();

  let title = $state('');

  $effect(() => {
    title = currentTitle;
  });

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (title.trim()) {
      onRename?.(title.trim());
    }
  }

  function handleOpenChange(value: boolean) {
    open = value;
    onOpenChange?.(value);
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
          <Pencil class="text-primary h-4 w-4" />
        </div>
        Rename document
      </Dialog.Title>
      <Dialog.Description>Enter a new name for your document.</Dialog.Description>
    </Dialog.Header>

    <form onsubmit={handleSubmit} class="space-y-4">
      <div class="space-y-2">
        <Input
          bind:value={title}
          placeholder="Document title"
          disabled={loading}
          autofocus
          class="h-11"
        />
      </div>

      <Dialog.Footer class="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onclick={() => handleOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !title.trim()} class="gap-2">
          {#if loading}
            <div
              class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            ></div>
            Saving...
          {:else}
            Save changes
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
