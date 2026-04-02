<script lang="ts">
  // ==========================================================================
  // File    : MarkdownEditor.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : CodeMirror-based Markdown editor with syntax highlighting.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-26
  // ==========================================================================

  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import type { EditorView } from '@codemirror/view';

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Props {
    content: string;
    readonly?: boolean;
    placeholder?: string;
    theme?: 'light' | 'dark';
    fontSize?: number;
    fontFamily?: string;
    tabSize?: number;
    lineWrapping?: boolean;
    spellCheck?: boolean;
    onContentChange?: (content: string) => void;
  }

  let {
    content = '',
    readonly = false,
    placeholder = 'Start writing markdown...',
    theme = 'light',
    fontSize = 14,
    fontFamily = 'mono',
    tabSize = 2,
    lineWrapping = true,
    spellCheck = false,
    onContentChange,
  }: Props = $props();

  // [*] Track external content changes for reactive updates
  let externalContent = $derived(content);

  // --------------------------------------------------------------------------
  // [SECTION] State
  // --------------------------------------------------------------------------

  let editorContainer: HTMLDivElement;
  let editorView: EditorView | null = null;
  let undoCmd: ((view: EditorView) => boolean) | null = null;
  let redoCmd: ((view: EditorView) => boolean) | null = null;
  let lastAppliedTheme: 'light' | 'dark' | null = null;

  // [*] Store themes for reconfiguration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lightThemeExtension: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let darkThemeExtension: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let styleCompartment: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tabSizeCompartment: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lineWrappingCompartment: any = null;

  // [*] Font family mapping
  const fontFamilies: Record<string, string> = {
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    jetbrains: '"JetBrains Mono", ui-monospace, monospace',
    fira: '"Fira Code", ui-monospace, monospace',
    source: '"Source Code Pro", ui-monospace, monospace',
  };

  // --------------------------------------------------------------------------
  // [SECTION] Lifecycle
  // --------------------------------------------------------------------------

  onMount(async () => {
    if (!browser) return;

    // [*] Dynamic imports for browser-only CodeMirror
    const {
      EditorView,
      keymap,
      placeholder: cmPlaceholder,
      drawSelection,
    } = await import('@codemirror/view');
    const { EditorState } = await import('@codemirror/state');
    const { markdown, markdownLanguage } = await import('@codemirror/lang-markdown');
    const { languages } = await import('@codemirror/language-data');
    const { defaultKeymap, history, historyKeymap, undo, redo } = await import(
      '@codemirror/commands'
    );
    const { oneDark } = await import('@codemirror/theme-one-dark');
    const { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } = await import(
      '@codemirror/language'
    );
    const { tags } = await import('@lezer/highlight');

    // [*] Store undo/redo commands
    undoCmd = undo;
    redoCmd = redo;

    // --------------------------------------------------------------------------
    // [SECTION] Custom Light Theme with Selection
    // --------------------------------------------------------------------------

    // [*] Create dynamic style extension that reads CSS custom properties
    const dynamicStyles = EditorView.theme({
      '&': {
        backgroundColor: 'transparent',
        height: '100%',
      },
      '.cm-content': {
        fontFamily: fontFamilies[fontFamily] || fontFamilies.mono,
        fontSize: `${fontSize}px`,
        lineHeight: '1.6',
        padding: '1rem 0',
        caretColor: 'hsl(var(--primary))',
      },
      '.cm-line': {
        padding: '0 1.5rem',
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'hsl(var(--primary))',
        borderLeftWidth: '2px',
      },
      // [*] Selection styling
      '.cm-selectionBackground': {
        backgroundColor: 'hsl(var(--primary) / 0.3) !important',
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: 'hsl(var(--primary) / 0.3) !important',
      },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
        backgroundColor: 'hsl(var(--primary) / 0.3) !important',
      },
      '::selection': {
        backgroundColor: 'hsl(var(--primary) / 0.3)',
      },
      '.cm-placeholder': {
        color: 'hsl(var(--muted-foreground))',
        fontStyle: 'italic',
      },
    });

    const lightTheme = dynamicStyles;

    // [*] Store theme extensions for reconfiguration
    lightThemeExtension = lightTheme;
    darkThemeExtension = oneDark;

    // --------------------------------------------------------------------------
    // [SECTION] Markdown Highlight Style
    // --------------------------------------------------------------------------

    const markdownHighlight = HighlightStyle.define([
      { tag: tags.heading1, fontWeight: '700', fontSize: '1.5em' },
      { tag: tags.heading2, fontWeight: '600', fontSize: '1.3em' },
      { tag: tags.heading3, fontWeight: '600', fontSize: '1.15em' },
      { tag: tags.strong, fontWeight: '700' },
      { tag: tags.emphasis, fontStyle: 'italic' },
      { tag: tags.strikethrough, textDecoration: 'line-through' },
      { tag: tags.link, color: '#3b82f6', textDecoration: 'underline' },
      { tag: tags.url, color: '#60a5fa', opacity: '0.9' },
      { tag: tags.monospace, fontFamily: 'monospace', backgroundColor: 'hsl(var(--muted))' },
      { tag: tags.quote, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' },
      { tag: tags.list, color: 'hsl(var(--primary))' },
    ]);

    // [*] Create compartment for dynamic theme switching
    const { Compartment } = await import('@codemirror/state');
    const themeCompartment = new Compartment();

    // [*] Create compartments for dynamic settings
    styleCompartment = new Compartment();
    tabSizeCompartment = new Compartment();
    lineWrappingCompartment = new Compartment();

    // [*] Store compartment reference for theme switching
    (
      editorContainer as HTMLElement & { themeCompartment?: typeof themeCompartment }
    ).themeCompartment = themeCompartment;

    // [*] Store style compartment for settings updates
    (
      editorContainer as HTMLElement & { styleCompartment?: typeof styleCompartment }
    ).styleCompartment = styleCompartment;

    // --------------------------------------------------------------------------
    // [SECTION] Create Editor
    // --------------------------------------------------------------------------

    const extensions = [
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      cmPlaceholder(placeholder),
      lineWrappingCompartment.of(lineWrapping ? EditorView.lineWrapping : []),
      tabSizeCompartment.of(EditorState.tabSize.of(tabSize)),
      drawSelection(),
      syntaxHighlighting(defaultHighlightStyle),
      syntaxHighlighting(markdownHighlight),
      EditorState.readOnly.of(readonly),
      styleCompartment.of(lightTheme),
      themeCompartment.of(theme === 'dark' ? oneDark : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onContentChange) {
          onContentChange(update.state.doc.toString());
        }
      }),
      EditorView.contentAttributes.of({ spellcheck: spellCheck ? 'true' : 'false' }),
    ];

    editorView = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions,
      }),
      parent: editorContainer,
    });
  });

  onDestroy(() => {
    editorView?.destroy();
  });

  // --------------------------------------------------------------------------
  // [SECTION] Reactive Updates
  // --------------------------------------------------------------------------

  // [*] React to external content changes (e.g., from Yjs sync)
  $effect(() => {
    if (editorView && externalContent !== editorView.state.doc.toString()) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: externalContent,
        },
      });
    }
  });

  // [*] React to theme changes and reconfigure editor
  $effect(() => {
    if (editorView && theme !== lastAppliedTheme && lightThemeExtension && darkThemeExtension) {
      const container = editorContainer as HTMLElement & {
        themeCompartment?: { reconfigure: (ext: unknown) => unknown };
      };
      if (container.themeCompartment) {
        editorView.dispatch({
          effects: container.themeCompartment.reconfigure(
            theme === 'dark' ? darkThemeExtension : lightThemeExtension
          ),
        });
        lastAppliedTheme = theme;
      }
    }
  });

  // --------------------------------------------------------------------------
  // [SECTION] Public Methods
  // --------------------------------------------------------------------------

  export function getContent(): string {
    return editorView?.state.doc.toString() ?? '';
  }

  export function focus(): void {
    editorView?.focus();
  }

  export function undo(): void {
    if (editorView && undoCmd) {
      undoCmd(editorView);
    }
  }

  export function redo(): void {
    if (editorView && redoCmd) {
      redoCmd(editorView);
    }
  }

  export function insertText(text: string): void {
    if (!editorView) return;
    const selection = editorView.state.selection.main;
    // [*] Replace selected text or insert at cursor
    editorView.dispatch({
      changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: selection.from + text.length },
    });
    editorView.focus();
  }

  export function wrapSelection(before: string, after: string): void {
    if (!editorView) return;
    const selection = editorView.state.selection.main;
    const selectedText = editorView.state.doc.sliceString(selection.from, selection.to);
    const newText = before + selectedText + after;
    editorView.dispatch({
      changes: { from: selection.from, to: selection.to, insert: newText },
      selection: {
        anchor: selection.from + before.length,
        head: selection.from + before.length + selectedText.length,
      },
    });
    editorView.focus();
  }

  export function prefixLines(prefix: string): void {
    if (!editorView) return;
    const state = editorView.state;
    const selection = state.selection.main;

    // [*] Find line boundaries for selection
    const fromLine = state.doc.lineAt(selection.from);
    const toLine = state.doc.lineAt(selection.to);

    // [*] Build changes for each line in selection
    const changes: { from: number; to: number; insert: string }[] = [];
    for (let lineNum = fromLine.number; lineNum <= toLine.number; lineNum++) {
      const line = state.doc.line(lineNum);
      changes.push({
        from: line.from,
        to: line.from,
        insert: prefix,
      });
    }

    editorView.dispatch({ changes });
    editorView.focus();
  }

  export function getSelection(): { from: number; to: number; text: string } {
    if (!editorView) return { from: 0, to: 0, text: '' };
    const selection = editorView.state.selection.main;
    return {
      from: selection.from,
      to: selection.to,
      text: editorView.state.doc.sliceString(selection.from, selection.to),
    };
  }
</script>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Editor Container -->
<!-- -------------------------------------------------------------------------- -->

<div class="markdown-editor h-full overflow-auto" bind:this={editorContainer}></div>

<style>
  .markdown-editor {
    display: flex;
    flex-direction: column;
  }

  .markdown-editor :global(.cm-editor) {
    flex: 1;
    outline: none;
  }

  .markdown-editor :global(.cm-scroller) {
    overflow: auto;
  }

  /* [*] Selection highlight */
  .markdown-editor :global(.cm-selectionBackground) {
    background-color: hsl(var(--primary) / 0.3) !important;
  }

  .markdown-editor :global(.cm-focused .cm-selectionBackground) {
    background-color: hsl(var(--primary) / 0.3) !important;
  }

  .markdown-editor :global(.cm-selectionLayer) {
    z-index: 1;
  }

  /* [*] Cursor blink */
  @keyframes -global-blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>
