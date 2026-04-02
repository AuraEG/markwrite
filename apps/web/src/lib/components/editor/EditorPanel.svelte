<script lang="ts">
  // ==========================================================================
  // File    : EditorPanel.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Main editor panel with CodeMirror Markdown editor and Yjs CRDT.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // Updated : 2026-03-27 - Added Hocuspocus WebSocket sync support
  // Updated : 2026-03-31 - Added theme support for dark mode
  // Updated : 2026-04-02 - Added user settings integration
  // ==========================================================================

  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import * as Y from 'yjs';
  import {
    decodeYjsState,
    encodeYjsState,
    createHocuspocusProvider,
    getSessionToken,
  } from '$lib/collaboration';
  import type { HocuspocusProvider } from '@hocuspocus/provider';
  import MarkdownEditor from './MarkdownEditor.svelte';
  import MarkdownToolbar from './MarkdownToolbar.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Props {
    documentId: string;
    initialState?: string | null;
    initialContent?: string;
    readonly?: boolean;
    placeholder?: string;
    enableRealTimeSync?: boolean;
    currentUserId?: string;
    currentUsername?: string;
    onContentUpdate?: (content: string) => void;
    onStateUpdate?: (state: string) => void;
    onSyncStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
    onCollaboratorsChange?: (collaborators: Array<{ id: string; username: string }>) => void;
  }

  let {
    documentId,
    initialState = null,
    initialContent = '',
    readonly = false,
    placeholder = 'Start writing markdown...',
    enableRealTimeSync = false,
    currentUserId = '',
    currentUsername = 'Anonymous',
    onContentUpdate,
    onStateUpdate,
    onSyncStatusChange,
    onCollaboratorsChange,
  }: Props = $props();

  // --------------------------------------------------------------------------
  // [SECTION] State
  // --------------------------------------------------------------------------

  let content = $state('');
  let ydoc: Y.Doc | null = $state(null);
  let ytext: Y.Text | null = $state(null);
  let provider: HocuspocusProvider | null = null;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let versionSaveInterval: ReturnType<typeof setInterval> | null = null;
  let lastVersionSave: Date = new Date();
  let isMounted = false;
  let editorRef: MarkdownEditor | null = null;
  let syncStatus = $state<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  let isRemoteChange = false; // [*] Flag to prevent echo loops

  // --------------------------------------------------------------------------
  // [SECTION] Lifecycle
  // --------------------------------------------------------------------------

  onMount(async () => {
    isMounted = true;

    // [*] Load user settings from API
    await settingsStore.loadSettings();

    // [*] Cache props at mount time to avoid reactivity warnings
    const cachedInitialContent = initialContent;
    const cachedDocumentId = documentId;
    const cachedEnableRealTimeSync = enableRealTimeSync;

    // [*] Create Yjs document for CRDT sync
    ydoc = new Y.Doc();
    ytext = ydoc.getText('content');

    // [*] Load initial state if provided (before connecting to sync server)
    if (initialState) {
      try {
        decodeYjsState(ydoc, initialState);
        content = ytext.toString();
      } catch (error) {
        console.error('[EditorPanel] Failed to load initial state:', error);
        if (cachedInitialContent) {
          ytext.insert(0, cachedInitialContent);
          content = cachedInitialContent;
        }
      }
    } else if (cachedInitialContent) {
      ytext.insert(0, cachedInitialContent);
      content = cachedInitialContent;
    }

    // [*] Connect to Hocuspocus for real-time sync if enabled
    if (cachedEnableRealTimeSync && browser && ydoc) {
      syncStatus = 'connecting';
      onSyncStatusChange?.('connecting');

      provider = createHocuspocusProvider({
        documentId: cachedDocumentId,
        ydoc: ydoc,
        token: getSessionToken() || undefined,
        onConnect: () => {
          syncStatus = 'connected';
          onSyncStatusChange?.('connected');

          // [*] Set local awareness state
          if (provider?.awareness) {
            provider.awareness.setLocalStateField('user', {
              id: currentUserId || 'anonymous',
              username: currentUsername,
            });
          }
        },
        onDisconnect: () => {
          syncStatus = 'disconnected';
          onSyncStatusChange?.('disconnected');
        },
        onSynced: () => {
          // [*] Update content from synced state
          if (ytext) {
            content = ytext.toString();
            onContentUpdate?.(content);
          }
        },
        onError: (error) => {
          console.error('[EditorPanel] Sync error:', error);
          syncStatus = 'error';
          onSyncStatusChange?.('error');
        },
      });

      // [*] Listen for awareness changes
      if (provider.awareness) {
        provider.awareness.on('change', () => {
          if (!provider?.awareness) return;

          const states = Array.from(provider.awareness.getStates().entries());
          const collaborators = states
            .filter(([clientId]) => clientId !== provider.awareness.clientID)
            .map(([_, state]) => state.user)
            .filter((user): user is { id: string; username: string } => !!user);

          onCollaboratorsChange?.(collaborators);
        });
      }
    }

    // [*] Listen for remote changes
    if (ytext) {
      ytext.observe((event) => {
        // [*] Only process remote changes (not our own edits)
        if (ytext && isMounted && event.transaction.origin !== 'local') {
          const newContent = ytext.toString();
          if (newContent !== content) {
            isRemoteChange = true;
            content = newContent;
            onContentUpdate?.(content);
            // [*] Reset flag after a tick to allow CodeMirror to update
            setTimeout(() => {
              isRemoteChange = false;
            }, 0);
          }
        }
      });
    }

    // [*] Start auto-save version interval (every 5 minutes)
    versionSaveInterval = setInterval(
      async () => {
        await saveVersion();
      },
      5 * 60 * 1000
    );

    // [*] Notify parent of initial content
    if (onContentUpdate) {
      onContentUpdate(content);
    }
  });

  onDestroy(() => {
    isMounted = false;

    // [*] Clear version save interval
    if (versionSaveInterval) {
      clearInterval(versionSaveInterval);
    }

    // [*] Final save before destroy
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    if (onStateUpdate && ydoc) {
      onStateUpdate(encodeYjsState(ydoc));
    }

    // [*] Disconnect from sync server
    if (provider) {
      provider.destroy();
      provider = null;
    }

    // [*] Cleanup Yjs document
    if (ydoc) {
      ydoc.destroy();
    }
  });

  // --------------------------------------------------------------------------
  // [SECTION] Version Save
  // --------------------------------------------------------------------------

  async function saveVersion() {
    if (!ydoc || !isMounted) return;

    // [*] Don't save empty documents
    if (!content || content.trim().length === 0) return;

    // [*] Don't save too frequently (minimum 1 minute between saves)
    const now = new Date();
    const timeSinceLastSave = now.getTime() - lastVersionSave.getTime();
    if (timeSinceLastSave < 60000) {
      return;
    }

    try {
      const yjsSnapshot = encodeYjsState(ydoc);

      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yjsSnapshot }),
      });

      if (response.ok) {
        lastVersionSave = now;
        console.log('[*] Version saved automatically');
      }
    } catch (error) {
      console.error('[!] Failed to save version:', error);
    }
  }

  // [*] Handle Ctrl+S / Cmd+S to manually save a version
  function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      // [*] Force save by resetting lastVersionSave
      lastVersionSave = new Date(0);
      saveVersion();
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION] Handlers
  // --------------------------------------------------------------------------

  function handleContentChange(newContent: string) {
    // [*] Skip if this is an echo from a remote change
    if (isRemoteChange) {
      return;
    }

    content = newContent;

    // [*] Update Yjs text with local origin marker
    if (ytext && ydoc) {
      ydoc.transact(() => {
        ytext!.delete(0, ytext!.length);
        ytext!.insert(0, newContent);
      }, 'local'); // [*] Mark as local transaction
    }

    // [*] Notify parent of content change
    if (onContentUpdate) {
      onContentUpdate(newContent);
    }

    // [*] Debounced state save
    if (onStateUpdate && ydoc) {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = setTimeout(() => {
        if (ydoc && isMounted) {
          onStateUpdate(encodeYjsState(ydoc));
        }
      }, 1000);
    }
  }

  function handleAction(
    actionType: 'wrap' | 'linePrefix' | 'insert',
    before: string,
    after?: string,
    placeholder?: string
  ) {
    if (!editorRef) return;

    const selection = editorRef.getSelection();

    switch (actionType) {
      case 'wrap':
        if (selection.text && after) {
          // [*] Wrap selected text with markdown syntax
          editorRef.wrapSelection(before, after);
        } else {
          // [*] Insert with placeholder if no selection
          const text = placeholder || '';
          editorRef.insertText(before + text + (after || ''));
        }
        break;

      case 'linePrefix':
        // [*] Add prefix to line(s) - works with selection or current line
        editorRef.prefixLines(before);
        break;

      case 'insert': {
        // [*] Simple insert at cursor
        const insertText = placeholder ? before + placeholder + (after || '') : before;
        editorRef.insertText(insertText);
        break;
      }
    }
  }

  function handleUndo() {
    editorRef?.undo();
  }

  function handleRedo() {
    editorRef?.redo();
  }

  // --------------------------------------------------------------------------
  // [SECTION] Public Methods
  // --------------------------------------------------------------------------

  export function getContent(): string {
    return content;
  }

  export function getState(): string {
    return ydoc ? encodeYjsState(ydoc) : '';
  }

  export function getSyncStatus(): typeof syncStatus {
    return syncStatus;
  }

  export function focus(): void {
    editorRef?.focus();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Editor Panel -->
<!-- -------------------------------------------------------------------------- -->

<div class="flex h-full flex-col">
  <!-- Toolbar -->
  <MarkdownToolbar {readonly} onAction={handleAction} onUndo={handleUndo} onRedo={handleRedo} />

  <!-- Editor Content Area -->
  <div class="flex-1 overflow-hidden">
    <MarkdownEditor
      bind:this={editorRef}
      {content}
      {readonly}
      {placeholder}
      theme={themeStore.resolvedTheme}
      fontSize={settingsStore.settings.fontSize}
      fontFamily={settingsStore.settings.fontFamily}
      tabSize={settingsStore.settings.tabSize}
      lineWrapping={settingsStore.settings.lineWrapping}
      spellCheck={settingsStore.settings.spellCheck}
      onContentChange={handleContentChange}
    />
  </div>
</div>
