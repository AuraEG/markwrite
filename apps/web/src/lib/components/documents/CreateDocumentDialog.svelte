<script lang="ts">
  // ==========================================================================
  // File    : CreateDocumentDialog.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Dialog for creating a new document with title input.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import Plus from '@lucide/svelte/icons/plus';
  import FileText from '@lucide/svelte/icons/file-text';

  interface Props {
    open?: boolean;
    loading?: boolean;
    onOpenChange?: (open: boolean) => void;
    onCreate?: (title: string) => void;
  }

  let { open = $bindable(false), loading = false, onOpenChange, onCreate }: Props = $props();

  let title = $state('');

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (title.trim() || !title) {
      onCreate?.(title.trim() || 'Untitled');
      title = '';
    }
  }

  function handleOpenChange(value: boolean) {
    open = value;
    onOpenChange?.(value);
    if (!value) {
      title = '';
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
          <FileText class="text-primary h-4 w-4" />
        </div>
        Create new document
      </Dialog.Title>
      <Dialog.Description>
        Give your document a name. You can always change it later.
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={handleSubmit} class="space-y-4">
      <div class="space-y-2">
        <Input
          bind:value={title}
          placeholder="Document title (optional)"
          disabled={loading}
          autofocus
          class="h-11"
        />
      </div>

      <Dialog.Footer class="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onclick={() => handleOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} class="gap-2">
          {#if loading}
            <div
              class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            ></div>
            Creating...
          {:else}
            <Plus class="h-4 w-4" />
            Create document
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
