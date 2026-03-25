<script lang="ts">
  // ==========================================================================
  // File    : EditorHeader.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Document editor header with title, actions, and collaborator avatars.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Share2 from '@lucide/svelte/icons/share-2';
  import History from '@lucide/svelte/icons/history';
  import Download from '@lucide/svelte/icons/download';
  import Check from '@lucide/svelte/icons/check';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import type { Snippet } from 'svelte';

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Collaborator {
    userId: string;
    username: string;
    avatarUrl: string | null;
    permission: string;
  }

  interface Owner {
    id: string;
    username: string;
    avatarUrl: string | null;
  }

  interface Props {
    title: string;
    canEdit: boolean;
    isOwner: boolean;
    isSaving: boolean;
    lastSaved: Date | null;
    owner: Owner;
    collaborators: Collaborator[];
    actions?: Snippet;
  }

  let { title, canEdit, isOwner, isSaving, lastSaved, owner, collaborators, actions }: Props =
    $props();

  // --------------------------------------------------------------------------
  // [SECTION] State
  // --------------------------------------------------------------------------

  let isEditingTitle = $state(false);
  let editedTitle = $state('');

  // [*] Sync editedTitle with prop when not editing
  $effect(() => {
    if (!isEditingTitle) {
      editedTitle = title;
    }
  });
</script>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Header -->
<!-- -------------------------------------------------------------------------- -->

<header class="border-border bg-background flex h-14 items-center justify-between border-b px-4">
  <!-- Left Section: Back + Title -->
  <div class="flex items-center gap-3">
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Button variant="ghost" size="icon" href="/documents" class="h-9 w-9">
          <ArrowLeft class="h-4 w-4" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>Back to documents</Tooltip.Content>
    </Tooltip.Root>

    {#if isEditingTitle && canEdit}
      <Input
        bind:value={editedTitle}
        class="h-8 w-64 text-lg font-semibold"
        onblur={() => (isEditingTitle = false)}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            isEditingTitle = false;
          }
          if (e.key === 'Escape') {
            editedTitle = title;
            isEditingTitle = false;
          }
        }}
      />
    {:else}
      <button
        class="hover:text-primary text-lg font-semibold transition-colors {canEdit
          ? 'cursor-pointer'
          : 'cursor-default'}"
        onclick={() => canEdit && (isEditingTitle = true)}
        disabled={!canEdit}
      >
        {title}
      </button>
    {/if}

    <!-- Saving Indicator -->
    {#if isSaving}
      <span class="text-muted-foreground flex items-center gap-1 text-xs">
        <Loader2 class="h-3 w-3 animate-spin" />
        Saving...
      </span>
    {:else if lastSaved}
      <span class="text-muted-foreground flex items-center gap-1 text-xs">
        <Check class="h-3 w-3 text-green-500" />
        Saved
      </span>
    {/if}
  </div>

  <!-- Center Section: Collaborators -->
  <div class="flex items-center gap-1">
    <!-- Owner Avatar -->
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Avatar.Root class="border-primary h-8 w-8 border-2">
          {#if owner.avatarUrl}
            <Avatar.Image src={owner.avatarUrl} alt={owner.username} />
          {/if}
          <Avatar.Fallback class="bg-primary/10 text-primary text-xs">
            {owner.username.slice(0, 2).toUpperCase()}
          </Avatar.Fallback>
        </Avatar.Root>
      </Tooltip.Trigger>
      <Tooltip.Content>{owner.username} (Owner)</Tooltip.Content>
    </Tooltip.Root>

    <!-- Collaborator Avatars -->
    {#each collaborators.slice(0, 4) as collab}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Avatar.Root class="border-background -ml-2 h-8 w-8 border-2">
            {#if collab.avatarUrl}
              <Avatar.Image src={collab.avatarUrl} alt={collab.username} />
            {/if}
            <Avatar.Fallback class="bg-muted text-muted-foreground text-xs">
              {collab.username.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
        </Tooltip.Trigger>
        <Tooltip.Content>
          {collab.username} ({collab.permission === 'edit' ? 'Can edit' : 'Can view'})
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}

    {#if collaborators.length > 4}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Avatar.Root class="border-background -ml-2 h-8 w-8 border-2">
            <Avatar.Fallback class="bg-muted text-muted-foreground text-xs">
              +{collaborators.length - 4}
            </Avatar.Fallback>
          </Avatar.Root>
        </Tooltip.Trigger>
        <Tooltip.Content>{collaborators.length - 4} more collaborators</Tooltip.Content>
      </Tooltip.Root>
    {/if}
  </div>

  <!-- Right Section: Actions -->
  <div class="flex items-center gap-1">
    {#if actions}
      {@render actions()}
    {/if}

    {#if isOwner}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button variant="ghost" size="icon" class="h-9 w-9">
            <Share2 class="h-4 w-4" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Share document</Tooltip.Content>
      </Tooltip.Root>
    {/if}

    <Tooltip.Root>
      <Tooltip.Trigger>
        <Button variant="ghost" size="icon" class="h-9 w-9">
          <History class="h-4 w-4" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>Version history</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger>
        <Button variant="ghost" size="icon" class="h-9 w-9">
          <Download class="h-4 w-4" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>Export document</Tooltip.Content>
    </Tooltip.Root>
  </div>
</header>
