<script lang="ts">
  // ==========================================================================
  // File    : DeleteDocumentDialog.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Confirmation dialog for deleting a document.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';

  interface Props {
    open?: boolean;
    loading?: boolean;
    documentTitle?: string;
    onOpenChange?: (open: boolean) => void;
    onConfirm?: () => void;
  }

  let {
    open = $bindable(false),
    loading = false,
    documentTitle = 'this document',
    onOpenChange,
    onConfirm,
  }: Props = $props();

  function handleOpenChange(value: boolean) {
    open = value;
    onOpenChange?.(value);
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="bg-destructive/10 flex h-8 w-8 items-center justify-center rounded-lg">
          <AlertTriangle class="text-destructive h-4 w-4" />
        </div>
        Delete document
      </Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete <strong class="text-foreground">"{documentTitle}"</strong>?
        This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer class="gap-2 sm:gap-0">
      <Button variant="outline" onclick={() => handleOpenChange(false)}>Cancel</Button>
      <Button variant="destructive" disabled={loading} onclick={onConfirm} class="gap-2">
        {#if loading}
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          ></div>
          Deleting...
        {:else}
          Delete document
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
