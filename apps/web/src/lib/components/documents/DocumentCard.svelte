<script lang="ts">
  // ==========================================================================
  // File    : DocumentCard.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Document card component with actions dropdown.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import * as Card from '$lib/components/ui/card';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import FileText from '@lucide/svelte/icons/file-text';
  import MoreVertical from '@lucide/svelte/icons/more-vertical';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Share2 from '@lucide/svelte/icons/share-2';
  import Globe from '@lucide/svelte/icons/globe';
  import Lock from '@lucide/svelte/icons/lock';
  import { formatDistanceToNow } from 'date-fns';
  import { scale, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  interface Document {
    id: string;
    title: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
  }

  interface Props {
    document: Document;
    index?: number;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
    onShare?: (id: string) => void;
  }

  let { document, index = 0, onRename, onDelete, onShare }: Props = $props();

  const formattedDate = $derived(
    formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })
  );
</script>

<div
  in:fly={{ y: 20, duration: 300, delay: index * 50, easing: cubicOut }}
  out:scale={{ duration: 200 }}
>
  <Card.Root
    class="hover:shadow-primary/5 group relative cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
  >
    <a href="/documents/{document.id}" class="block">
      <Card.Header class="pb-3">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
            >
              <FileText class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <Card.Title class="truncate text-base font-semibold">
                {document.title}
              </Card.Title>
              <div class="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                {#if document.isPublic}
                  <Globe class="h-3 w-3" />
                  <span>Public</span>
                {:else}
                  <Lock class="h-3 w-3" />
                  <span>Private</span>
                {/if}
              </div>
            </div>
          </div>

          <!-- [*] Actions menu - stop propagation to prevent card click -->
          <div
            class="opacity-0 transition-opacity group-hover:opacity-100"
            onclick={(e) => e.preventDefault()}
            onkeydown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                class="hover:bg-accent inline-flex h-8 w-8 items-center justify-center rounded-md"
              >
                <MoreVertical class="h-4 w-4" />
                <span class="sr-only">Open menu</span>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" class="w-48">
                <DropdownMenu.Item onclick={() => onRename?.(document.id)}>
                  <Pencil class="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => onShare?.(document.id)}>
                  <Share2 class="mr-2 h-4 w-4" />
                  Share
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  onclick={() => onDelete?.(document.id)}
                  class="text-destructive focus:text-destructive"
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
      </Card.Header>
      <Card.Footer class="pt-0">
        <p class="text-muted-foreground text-xs">
          Updated {formattedDate}
        </p>
      </Card.Footer>
    </a>
  </Card.Root>
</div>
