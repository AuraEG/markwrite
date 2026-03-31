<!-- 
==========================================================================
File    : ShareDialog.svelte
Project : MarkWrite
Layer   : Component
Purpose : Document sharing dialog with collaborator management, link 
          sharing, and public toggle.

Author  : AuraEG Team
Created : 2026-03-31
==========================================================================
-->

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Badge } from '$lib/components/ui/badge';
  import Share2 from '@lucide/svelte/icons/share-2';
  import Copy from '@lucide/svelte/icons/copy';
  import Link2 from '@lucide/svelte/icons/link-2';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import Check from '@lucide/svelte/icons/check';
  import X from '@lucide/svelte/icons/x';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import { toast } from 'svelte-sonner';

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  let {
    open = $bindable(false),
    documentId,
    isOwner = false,
    initialIsPublic = false,
    initialShareToken = null,
    initialGistUrl = null,
  }: {
    open: boolean;
    documentId: string;
    isOwner: boolean;
    initialIsPublic: boolean;
    initialShareToken: string | null;
    initialGistUrl: string | null;
  } = $props();

  // --------------------------------------------------------------------------
  // [SECTION] State
  // --------------------------------------------------------------------------

  let collaborators = $state<
    Array<{
      userId: string;
      username: string;
      avatarUrl: string | null;
      permission: 'view' | 'edit';
    }>
  >([]);

  let isPublic = $state(false);
  let shareToken = $state<string | null>(null);
  let shareUrl = $state('');
  let gistUrl = $state<string | null>(null);

  let usernameInput = $state('');
  let selectedPermission = $state<'view' | 'edit'>('edit');
  let isAddingCollaborator = $state(false);
  let isGeneratingLink = $state(false);
  let isCreatingGist = $state(false);
  let isCopied = $state(false);
  let isGistCopied = $state(false);
  let isLoading = $state(false);

  // --------------------------------------------------------------------------
  // [SECTION] Computed
  // --------------------------------------------------------------------------

  let hasShareLink = $derived(!!shareToken);
  let hasGist = $derived(!!gistUrl);

  // --------------------------------------------------------------------------
  // [SECTION] Lifecycle
  // --------------------------------------------------------------------------

  // [*] Initialize state from props when dialog opens
  $effect(() => {
    if (open) {
      isPublic = initialIsPublic;
      shareToken = initialShareToken;
      gistUrl = initialGistUrl;
      if (isOwner) {
        loadCollaborators();
      }
    }
  });

  // [*] Update share URL when token changes
  $effect(() => {
    if (shareToken) {
      shareUrl = `${window.location.origin}/documents/${documentId}?token=${shareToken}`;
    } else {
      shareUrl = '';
    }
  });

  // --------------------------------------------------------------------------
  // [SECTION] API Calls
  // --------------------------------------------------------------------------

  async function loadCollaborators() {
    try {
      const response = await fetch(`/api/documents/${documentId}/collaborators`);
      if (response.ok) {
        const data = await response.json();
        collaborators = data.collaborators;
      }
    } catch (err) {
      console.error('[!] Failed to load collaborators:', err);
    }
  }

  async function addCollaborator() {
    if (!usernameInput.trim()) return;

    isAddingCollaborator = true;
    try {
      const response = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.trim(),
          permission: selectedPermission,
        }),
      });

      if (response.ok) {
        toast.success(`Added ${usernameInput} with ${selectedPermission} access`);
        usernameInput = '';
        await loadCollaborators();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add collaborator');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      console.error('[!] Add collaborator error:', err);
    } finally {
      isAddingCollaborator = false;
    }
  }

  async function removeCollaborator(userId: string, username: string) {
    try {
      const response = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success(`Removed ${username}`);
        await loadCollaborators();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to remove collaborator');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      console.error('[!] Remove collaborator error:', err);
    }
  }

  async function generateShareLink() {
    isGeneratingLink = true;
    try {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        shareToken = data.token;
        toast.success('Share link generated');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to generate link');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      console.error('[!] Generate link error:', err);
    } finally {
      isGeneratingLink = false;
    }
  }

  async function revokeShareLink() {
    try {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: 'DELETE',
      });

      if (response.ok) {
        shareToken = null;
        shareUrl = '';
        toast.success('Share link revoked');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to revoke link');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      console.error('[!] Revoke link error:', err);
    }
  }

  async function togglePublicAccess() {
    isLoading = true;
    try {
      const response = await fetch(`/api/documents/${documentId}/public`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      });

      if (response.ok) {
        const data = await response.json();
        isPublic = data.isPublic;
        toast.success(isPublic ? 'Document is now public' : 'Document is now private');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update public access');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      console.error('[!] Toggle public error:', err);
    } finally {
      isLoading = false;
    }
  }

  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch {
      return false;
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      isCopied = true;
      toast.success('Link copied to clipboard');
      setTimeout(() => (isCopied = false), 2000);
    } else {
      toast.error('Could not copy. Please copy manually.');
    }
  }

  async function copyGistLink() {
    if (!gistUrl) return;
    const success = await copyToClipboard(gistUrl);
    if (success) {
      isGistCopied = true;
      toast.success('Gist link copied to clipboard');
      setTimeout(() => (isGistCopied = false), 2000);
    } else {
      toast.error('Could not copy. Please copy manually.');
    }
  }

  async function createOrUpdateGist() {
    isCreatingGist = true;
    try {
      const response = await fetch(`/api/documents/${documentId}/gist`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        gistUrl = data.gistUrl;
        toast.success('Document shared to GitHub Gist!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create Gist');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      console.error('[!] Gist creation error:', err);
    } finally {
      isCreatingGist = false;
    }
  }

  async function unlinkGist() {
    try {
      const response = await fetch(`/api/documents/${documentId}/gist`, {
        method: 'DELETE',
      });

      if (response.ok) {
        gistUrl = null;
        toast.success('Gist unlinked');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to unlink Gist');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      console.error('[!] Gist unlink error:', err);
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION] Handlers
  // --------------------------------------------------------------------------

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && usernameInput.trim()) {
      addCollaborator();
    }
  }
</script>

<!-- ========================================================================== -->
<!-- [SECTION] Template -->
<!-- ========================================================================== -->

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[550px]">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Share2 class="h-5 w-5" />
        Share Document
      </Dialog.Title>
      <Dialog.Description>Manage who can access and edit this document.</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-6 py-4">
      <!-- Public Access Toggle -->
      {#if isOwner}
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="flex-1">
            <Label class="text-base font-medium">Public Access</Label>
            <p class="text-muted-foreground text-sm">
              Anyone on the internet can view this document
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={togglePublicAccess} disabled={isLoading} />
        </div>
      {/if}

      <!-- Share Link Section -->
      {#if isOwner}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label class="flex items-center gap-2 text-base font-medium">
              <Link2 class="h-4 w-4" />
              Share Link
            </Label>
            {#if hasShareLink}
              <Button
                variant="ghost"
                size="sm"
                onclick={revokeShareLink}
                class="text-destructive hover:text-destructive h-8 px-2"
              >
                <Trash2 class="mr-1 h-4 w-4" />
                Revoke
              </Button>
            {/if}
          </div>

          {#if hasShareLink}
            <div class="flex gap-2">
              <Input value={shareUrl} readonly class="font-mono text-sm" />
              <Button onclick={copyShareLink} variant="outline" size="icon">
                {#if isCopied}
                  <Check class="h-4 w-4 text-green-600" />
                {:else}
                  <Copy class="h-4 w-4" />
                {/if}
              </Button>
            </div>
            <p class="text-muted-foreground text-xs">
              Anyone with this link can access the document (local network only)
            </p>
          {:else}
            <Button
              onclick={generateShareLink}
              variant="outline"
              class="w-full"
              disabled={isGeneratingLink}
            >
              {#if isGeneratingLink}
                Generating...
              {:else}
                <Link2 class="mr-2 h-4 w-4" />
                Generate Share Link
              {/if}
            </Button>
          {/if}
        </div>
      {/if}

      <!-- GitHub Gist Section (Public Sharing) -->
      {#if isOwner}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label class="flex items-center gap-2 text-base font-medium">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"
                ><path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                /></svg
              >
              Share via GitHub Gist
            </Label>
            {#if hasGist}
              <Button
                variant="ghost"
                size="sm"
                onclick={unlinkGist}
                class="text-destructive hover:text-destructive h-8 px-2"
              >
                <Trash2 class="mr-1 h-4 w-4" />
                Unlink
              </Button>
            {/if}
          </div>

          {#if hasGist}
            <div class="flex gap-2">
              <Input value={gistUrl} readonly class="font-mono text-sm" />
              <Button onclick={copyGistLink} variant="outline" size="icon">
                {#if isGistCopied}
                  <Check class="h-4 w-4 text-green-600" />
                {:else}
                  <Copy class="h-4 w-4" />
                {/if}
              </Button>
              <Button
                onclick={() => window.open(gistUrl || '', '_blank')}
                variant="outline"
                size="icon"
              >
                <ExternalLink class="h-4 w-4" />
              </Button>
            </div>
            <p class="text-muted-foreground text-xs">
              Anyone on the internet can view this Gist. Click "Share" again to update content.
            </p>
            <Button
              onclick={createOrUpdateGist}
              variant="outline"
              class="w-full"
              disabled={isCreatingGist}
            >
              {#if isCreatingGist}
                Updating...
              {:else}
                <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"
                  ><path
                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                  /></svg
                >
                Update Gist
              {/if}
            </Button>
          {:else}
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-muted-foreground mb-3 text-sm">
                Create a public GitHub Gist that anyone can access - no local network or hosting
                required!
              </p>
              <Button
                onclick={createOrUpdateGist}
                variant="default"
                class="w-full"
                disabled={isCreatingGist}
              >
                {#if isCreatingGist}
                  Creating Gist...
                {:else}
                  <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"
                    ><path
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                    /></svg
                  >
                  Share to GitHub Gist
                {/if}
              </Button>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Add Collaborator Section -->
      {#if isOwner}
        <div class="space-y-3">
          <Label class="flex items-center gap-2 text-base font-medium">
            <UserPlus class="h-4 w-4" />
            Add Collaborator
          </Label>

          <div class="flex gap-2">
            <div class="flex-1">
              <Input
                bind:value={usernameInput}
                placeholder="Username"
                onkeydown={handleKeydown}
                disabled={isAddingCollaborator}
              />
            </div>
            <select
              bind:value={selectedPermission}
              class="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-[120px] items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="edit">Edit</option>
              <option value="view">View</option>
            </select>
            <Button
              onclick={addCollaborator}
              disabled={!usernameInput.trim() || isAddingCollaborator}
              size="icon"
            >
              <UserPlus class="h-4 w-4" />
            </Button>
          </div>
        </div>
      {/if}

      <!-- Collaborators List -->
      {#if collaborators.length > 0}
        <div class="space-y-3">
          <Label class="text-base font-medium">Collaborators</Label>
          <div class="max-h-[200px] space-y-2 overflow-y-auto">
            {#each collaborators as collaborator}
              <div class="flex items-center justify-between rounded-lg border p-3">
                <div class="flex items-center gap-3">
                  {#if collaborator.avatarUrl}
                    <img
                      src={collaborator.avatarUrl}
                      alt={collaborator.username}
                      class="h-8 w-8 rounded-full"
                    />
                  {:else}
                    <div
                      class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full"
                    >
                      <span class="text-sm font-medium">
                        {collaborator.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  {/if}
                  <div>
                    <p class="text-sm font-medium">{collaborator.username}</p>
                    <Badge variant="secondary" class="text-xs capitalize">
                      {collaborator.permission}
                    </Badge>
                  </div>
                </div>
                {#if isOwner}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => removeCollaborator(collaborator.userId, collaborator.username)}
                    class="text-muted-foreground hover:text-destructive h-8 px-2"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- ========================================================================== -->
<!-- [SECTION] Styles -->
<!-- ========================================================================== -->

<style>
  /* Custom scrollbar for collaborators list */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: hsl(var(--muted));
    border-radius: 3px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
  }
</style>
