<script lang="ts">
  // ==========================================================================
  // File    : PreviewPanel.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Live preview panel that renders Markdown and HTML content.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // Updated : 2026-03-26 - Full markdown and HTML rendering support
  // ==========================================================================

  import { browser } from '$app/environment';
  import { marked } from 'marked';

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Props {
    content: string;
  }

  let { content }: Props = $props();

  // --------------------------------------------------------------------------
  // [SECTION] Marked Configuration
  // --------------------------------------------------------------------------

  // [*] Configure marked for GFM with HTML support
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  // --------------------------------------------------------------------------
  // [SECTION] Content Processing
  // --------------------------------------------------------------------------

  function renderContent(markdown: string): string {
    if (!markdown || !markdown.trim()) {
      return '<p class="text-muted-foreground italic">Preview will appear here...</p>';
    }

    try {
      // [*] Parse markdown to HTML (marked handles embedded HTML)
      const html = marked.parse(markdown) as string;
      return html;
    } catch (error) {
      console.error('[PreviewPanel] Render failed:', error);
      return `<p class="text-destructive">Failed to render preview</p>`;
    }
  }

  let renderedContent = $derived(browser ? renderContent(content) : '');
</script>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Preview Panel -->
<!-- -------------------------------------------------------------------------- -->

<div class="flex h-full flex-col">
  <!-- Preview Header -->
  <div class="border-border bg-muted/30 flex h-10 items-center border-b px-4">
    <span class="text-muted-foreground text-xs font-medium uppercase tracking-wider">
      Preview
    </span>
  </div>

  <!-- Preview Content -->
  <div
    class="preview-content prose prose-slate dark:prose-invert max-w-none flex-1 overflow-auto p-6"
  >
    {@html renderedContent}
  </div>
</div>

<style>
  /* [*] Enhanced prose styling for preview */
  .preview-content :global(h1) {
    font-size: 2rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }

  .preview-content :global(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .preview-content :global(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  .preview-content :global(p) {
    margin: 0.75rem 0;
  }

  .preview-content :global(ul),
  .preview-content :global(ol) {
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }

  .preview-content :global(li) {
    margin: 0.25rem 0;
  }

  .preview-content :global(blockquote) {
    border-left: 3px solid var(--color-border);
    padding-left: 1rem;
    margin: 1rem 0;
    color: var(--color-muted-foreground);
    font-style: italic;
  }

  /* [*] Inline code styling */
  .preview-content :global(code) {
    background-color: var(--color-muted);
    color: var(--color-foreground);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-family: ui-monospace, monospace;
  }

  /* [*] Code blocks - GitHub-style dark background */
  .preview-content :global(pre) {
    background-color: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid var(--color-border);
  }

  .preview-content :global(pre code) {
    background: none;
    padding: 0;
    color: inherit;
  }

  .preview-content :global(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 1.5rem 0;
  }

  /* [*] Links - Blue color for visibility */
  .preview-content :global(a) {
    color: #3b82f6;
    text-decoration: underline;
  }

  .preview-content :global(a:hover) {
    color: #60a5fa;
    text-decoration: none;
  }

  /* [*] Image styling for badges and inline images */
  .preview-content :global(img) {
    display: inline-block;
    max-width: 100%;
    height: auto;
    vertical-align: middle;
  }

  /* [*] Badge images in links */
  .preview-content :global(a > img) {
    margin: 0.125rem;
  }

  /* [*] Tables styling - Dark mode friendly */
  .preview-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  .preview-content :global(th),
  .preview-content :global(td) {
    border: 1px solid var(--color-border);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  .preview-content :global(th) {
    background-color: var(--color-muted);
    color: var(--color-foreground);
    font-weight: 600;
  }

  .preview-content :global(tr:nth-child(even)) {
    background-color: var(--color-muted);
  }
</style>
