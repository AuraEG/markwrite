<script lang="ts">
  // ==========================================================================
  // File    : CollaboratorsList.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Display list of active collaborators with avatars and colors.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-27
  // ==========================================================================

  import Users from '@lucide/svelte/icons/users';
  import { Tooltip } from '$lib/components/ui/tooltip';
  import { getUserColor } from '$lib/utils/color-hash';

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Collaborator {
    id: string;
    username: string;
  }

  interface Props {
    collaborators: Collaborator[];
  }

  let { collaborators = [] }: Props = $props();

  // --------------------------------------------------------------------------
  // [SECTION] Computed
  // --------------------------------------------------------------------------

  let hasCollaborators = $derived(collaborators.length > 0);
</script>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Collaborators List -->
<!-- -------------------------------------------------------------------------- -->

{#if hasCollaborators}
  <div class="flex items-center gap-1">
    <Users class="text-muted-foreground h-4 w-4" />
    <div class="flex -space-x-2">
      {#each collaborators as collab (collab.id)}
        {@const colors = getUserColor(collab.id)}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            {#snippet child({ props })}
              <div
                {...props}
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white dark:border-gray-900"
                style="background-color: {colors.cursor}"
              >
                {collab.username.charAt(0).toUpperCase()}
              </div>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content>
            {collab.username}
          </Tooltip.Content>
        </Tooltip.Root>
      {/each}
    </div>
  </div>
{/if}
