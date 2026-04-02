<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { toast } from 'svelte-sonner';
  import Clock from '@lucide/svelte/icons/clock';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Tag from '@lucide/svelte/icons/tag';
  import Check from '@lucide/svelte/icons/check';
  import X from '@lucide/svelte/icons/x';
  import Edit2 from '@lucide/svelte/icons/edit-2';
  import User from '@lucide/svelte/icons/user';
  import Trash2 from '@lucide/svelte/icons/trash-2';

  interface Version {
    id: string;
    label: string | null;
    createdAt: string;
    author: {
      id: string;
      username: string;
      avatarUrl: string | null;
    } | null;
  }

  interface Props {
    documentId: string;
    open: boolean;
  }

  let { documentId, open = $bindable(false) }: Props = $props();

  let versions: Version[] = $state([]);
  let loading = $state(false);
  let selectedVersion: string | null = $state(null);
  let editingLabel: string | null = $state(null);
  let labelInput = $state('');
  let confirmDialog = $state({
    open: false,
    title: '',
    description: '',
    action: () => {},
  });

  // Load versions when dialog opens
  async function loadVersions() {
    loading = true;
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        versions = data.versions;
      } else {
        toast.error('Failed to load versions');
      }
    } catch (err) {
      console.error('[!] Error loading versions:', err);
      toast.error('Error loading versions');
    } finally {
      loading = false;
    }
  }

  // Restore a version
  async function restoreVersion(versionId: string) {
    confirmDialog = {
      open: true,
      title: 'Restore Version',
      description:
        'Are you sure you want to restore this version? The current state will be saved as a new version before restoring.',
      action: async () => {
        try {
          const response = await fetch(
            `/api/documents/${documentId}/versions/${versionId}/restore`,
            {
              method: 'POST',
            }
          );

          if (response.ok) {
            toast.success('Version restored successfully');
            // Reload versions and refresh page to show restored content
            await loadVersions();
            setTimeout(() => window.location.reload(), 1000);
          } else {
            toast.error('Failed to restore version');
          }
        } catch (err) {
          console.error('[!] Error restoring version:', err);
          toast.error('Error restoring version');
        }
      },
    };
  }

  // Delete a version
  async function deleteVersion(versionId: string) {
    confirmDialog = {
      open: true,
      title: 'Delete Version',
      description: 'Are you sure you want to delete this version? This action cannot be undone.',
      action: async () => {
        try {
          const response = await fetch(`/api/documents/${documentId}/versions/${versionId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            toast.success('Version deleted');
            // Remove from local state
            versions = versions.filter((v) => v.id !== versionId);
          } else {
            toast.error('Failed to delete version');
          }
        } catch (err) {
          console.error('[!] Error deleting version:', err);
          toast.error('Error deleting version');
        }
      },
    };
  }

  // Edit version label
  async function updateLabel(versionId: string, newLabel: string) {
    try {
      const response = await fetch(`/api/documents/${documentId}/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel }),
      });

      if (response.ok) {
        toast.success('Label updated');
        // Update in local state
        const version = versions.find((v) => v.id === versionId);
        if (version) {
          version.label = newLabel;
        }
        editingLabel = null;
        labelInput = '';
      } else {
        toast.error('Failed to update label');
      }
    } catch (err) {
      console.error('[!] Error updating label:', err);
      toast.error('Error updating label');
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function startEditingLabel(version: Version) {
    editingLabel = version.id;
    labelInput = version.label || '';
  }

  function cancelEditingLabel() {
    editingLabel = null;
    labelInput = '';
  }

  // Load versions when dialog opens
  $effect(() => {
    if (open) {
      loadVersions();
    }
  });
</script>

<Dialog {open} onOpenChange={(o) => (open = o)}>
  <DialogContent class="flex h-[85vh] max-w-2xl flex-col p-0">
    <div class="p-6 pb-3">
      <DialogHeader>
        <DialogTitle>Version History</DialogTitle>
        <DialogDescription>
          View and restore previous versions of this document. Restoring a version will save your
          current work as a new version.
        </DialogDescription>
      </DialogHeader>
    </div>

    <div class="flex-1 overflow-auto px-6 pb-6">
      {#if loading}
        <div class="space-y-3">
          {#each Array(5) as _}
            <div class="flex gap-3 rounded-lg border p-3">
              <Skeleton class="h-10 w-10 rounded-full" />
              <div class="flex-1 space-y-2">
                <Skeleton class="h-4 w-48" />
                <Skeleton class="h-3 w-32" />
              </div>
              <Skeleton class="h-8 w-20" />
            </div>
          {/each}
        </div>
      {:else if versions.length === 0}
        <div class="text-muted-foreground py-12 text-center">
          <Clock class="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p class="text-lg font-medium">No versions yet</p>
          <p class="text-sm">Versions are automatically created as you edit</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each versions as version}
            <div
              class="hover:bg-accent/50 flex gap-3 rounded-lg border p-3 transition-colors"
              class:bg-accent={selectedVersion === version.id}
            >
              <!-- Author avatar -->
              <div class="flex-shrink-0">
                {#if version.author?.avatarUrl}
                  <img
                    src={version.author.avatarUrl}
                    alt={version.author.username}
                    class="h-10 w-10 rounded-full"
                  />
                {:else}
                  <div class="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                    <User class="text-muted-foreground h-5 w-5" />
                  </div>
                {/if}
              </div>

              <!-- Version info -->
              <div class="min-w-0 flex-1">
                {#if editingLabel === version.id}
                  <div class="mb-1 flex items-center gap-2">
                    <Input
                      bind:value={labelInput}
                      placeholder="Add label..."
                      class="h-7 text-sm"
                      onkeydown={(e) => {
                        if (e.key === 'Enter') {
                          updateLabel(version.id, labelInput);
                        } else if (e.key === 'Escape') {
                          cancelEditingLabel();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-7 w-7 p-0"
                      onclick={() => updateLabel(version.id, labelInput)}
                    >
                      <Check class="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-7 w-7 p-0"
                      onclick={cancelEditingLabel}
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                {:else}
                  <div class="mb-1 flex items-center gap-2">
                    {#if version.label}
                      <Badge variant="secondary" class="text-xs">
                        <Tag class="mr-1 h-3 w-3" />
                        {version.label}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        class="h-5 w-5 p-0"
                        onclick={() => startEditingLabel(version)}
                      >
                        <Edit2 class="h-3 w-3" />
                      </Button>
                    {:else}
                      <Button
                        size="sm"
                        variant="ghost"
                        class="text-muted-foreground h-5 px-2 text-xs"
                        onclick={() => startEditingLabel(version)}
                      >
                        <Tag class="mr-1 h-3 w-3" />
                        Add label
                      </Button>
                    {/if}
                  </div>
                {/if}
                <p class="text-muted-foreground text-sm">
                  {#if version.author}
                    <span class="text-foreground font-medium">{version.author.username}</span>
                    {' • '}
                  {/if}
                  {formatDate(version.createdAt)}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex flex-shrink-0 items-center gap-2">
                <Button size="sm" variant="outline" onclick={() => restoreVersion(version.id)}>
                  <RotateCcw class="mr-1 h-4 w-4" />
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  class="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onclick={() => deleteVersion(version.id)}
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </DialogContent>
</Dialog>

<!-- Confirmation Dialog -->
<Dialog open={confirmDialog.open} onOpenChange={(o) => (confirmDialog.open = o)}>
  <DialogContent class="max-w-md">
    <DialogHeader>
      <DialogTitle>{confirmDialog.title}</DialogTitle>
      <DialogDescription>{confirmDialog.description}</DialogDescription>
    </DialogHeader>
    <div class="mt-4 flex justify-end gap-2">
      <Button variant="outline" onclick={() => (confirmDialog.open = false)}>Cancel</Button>
      <Button
        variant="destructive"
        onclick={() => {
          confirmDialog.action();
          confirmDialog.open = false;
        }}
      >
        Confirm
      </Button>
    </div>
  </DialogContent>
</Dialog>
