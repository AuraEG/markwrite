<script lang="ts">
  // ==========================================================================
  // File    : EditorPanel.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Main editor panel with CodeMirror Markdown editor and Yjs CRDT.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // Updated : 2026-03-26 - Added toolbar with formatting buttons
  // ==========================================================================

  import { onMount, onDestroy } from 'svelte';
  import * as Y from 'yjs';
  import { decodeYjsState, encodeYjsState } from '$lib/collaboration';
  import MarkdownEditor from './MarkdownEditor.svelte';
  import MarkdownToolbar from './MarkdownToolbar.svelte';

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Props {
    documentId: string;
    initialState?: string | null;
    initialContent?: string;
    readonly?: boolean;
    placeholder?: string;
    onContentUpdate?: (content: string) => void;
    onStateUpdate?: (state: string) => void;
  }

  let {
    documentId: _documentId,
    initialState = null,
    initialContent = '',
    readonly = false,
    placeholder = 'Start writing markdown...',
    onContentUpdate,
    onStateUpdate,
  }: Props = $props();

  // --------------------------------------------------------------------------
  // [SECTION] State
  // --------------------------------------------------------------------------

  let content = $state('');
  let ydoc: Y.Doc | null = $state(null);
  let ytext: Y.Text | null = $state(null);
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let isMounted = false;
  let editorRef: MarkdownEditor | null = null;

  // --------------------------------------------------------------------------
  // [SECTION] Lifecycle
  // --------------------------------------------------------------------------

  onMount(() => {
    isMounted = true;

    // [*] Cache props at mount time to avoid reactivity warnings
    const cachedInitialContent = initialContent;

    // [*] Create Yjs document for CRDT sync
    ydoc = new Y.Doc();
    ytext = ydoc.getText('content');

    // [*] Load initial state if provided
    if (initialState) {
      try {
        decodeYjsState(ydoc, initialState);
        content = ytext.toString();
      } catch (error) {
        console.error('[EditorPanel] Failed to load initial state:', error);
        // Fall back to initialContent
        if (cachedInitialContent) {
          ytext.insert(0, cachedInitialContent);
          content = cachedInitialContent;
        }
      }
    } else if (cachedInitialContent) {
      // [*] Initialize with content if no state
      ytext.insert(0, cachedInitialContent);
      content = cachedInitialContent;
    }

    // [*] Notify parent of initial content
    if (onContentUpdate) {
      onContentUpdate(content);
    }
  });

  onDestroy(() => {
    isMounted = false;

    // [*] Final save before destroy
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    if (onStateUpdate && ydoc) {
      onStateUpdate(encodeYjsState(ydoc));
    }

    // [*] Cleanup
    if (ydoc) {
      ydoc.destroy();
    }
  });

  // --------------------------------------------------------------------------
  // [SECTION] Handlers
  // --------------------------------------------------------------------------

  function handleContentChange(newContent: string) {
    content = newContent;

    // [*] Update Yjs text
    if (ytext) {
      ydoc?.transact(() => {
        ytext!.delete(0, ytext!.length);
        ytext!.insert(0, newContent);
      });
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

  export function focus(): void {
    editorRef?.focus();
  }
</script>

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
      onContentChange={handleContentChange}
    />
  </div>
</div>
