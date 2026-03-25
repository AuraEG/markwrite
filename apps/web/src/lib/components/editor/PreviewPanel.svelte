<script lang="ts">
  // ==========================================================================
  // File    : PreviewPanel.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Markdown preview panel with rendered content.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Props {
    content: string;
  }

  let { content }: Props = $props();

  // --------------------------------------------------------------------------
  // [SECTION] Markdown Rendering
  // Note: Basic HTML escaping for now. Will integrate marked/remark later.
  // --------------------------------------------------------------------------

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderBasicMarkdown(text: string): string {
    if (!text.trim()) {
      return '<p class="text-muted-foreground italic">Preview will appear here...</p>';
    }

    let html = escapeHtml(text);

    // [*] Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

    // [*] Bold and Italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/__(.+?)__/g, '<strong class="font-bold">$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>');

    // [*] Inline Code
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    );

    // [*] Code Blocks
    html = html.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">$2</code></pre>'
    );

    // [*] Blockquotes
    html = html.replace(
      /^&gt; (.+)$/gm,
      '<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">$1</blockquote>'
    );

    // [*] Horizontal Rule
    html = html.replace(/^---$/gm, '<hr class="my-6 border-border" />');

    // [*] Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener">$1</a>'
    );

    // [*] Unordered Lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="list-disc my-2">$&</ul>');

    // [*] Paragraphs (lines with content that aren't already wrapped)
    html = html
      .split('\n')
      .map((line) => {
        if (
          line.trim() &&
          !line.startsWith('<h') &&
          !line.startsWith('<pre') &&
          !line.startsWith('<blockquote') &&
          !line.startsWith('<hr') &&
          !line.startsWith('<ul') &&
          !line.startsWith('<li') &&
          !line.startsWith('</ul')
        ) {
          return `<p class="my-2">${line}</p>`;
        }
        return line;
      })
      .join('\n');

    return html;
  }

  let renderedContent = $derived(renderBasicMarkdown(content));
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
  <div class="prose prose-slate dark:prose-invert max-w-none flex-1 overflow-auto p-6">
    {@html renderedContent}
  </div>
</div>
