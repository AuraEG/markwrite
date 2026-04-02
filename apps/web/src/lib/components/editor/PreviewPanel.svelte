<script lang="ts">
  // ==========================================================================
  // File    : PreviewPanel.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Live preview panel that renders Markdown with syntax highlighting
  //           and LaTeX math rendering using KaTeX.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // Updated : 2026-03-26 - Full markdown and HTML rendering support
  // Updated : 2026-04-02 - Added syntax highlighting with highlight.js
  // Updated : 2026-04-02 - Added KaTeX math rendering support
  // ==========================================================================

  import { browser } from '$app/environment';
  import { marked } from 'marked';
  import { onMount } from 'svelte';
  import hljs from 'highlight.js/lib/core';
  import katex from 'katex';
  import 'katex/dist/katex.min.css';

  // [*] Import common languages for syntax highlighting
  import javascript from 'highlight.js/lib/languages/javascript';
  import typescript from 'highlight.js/lib/languages/typescript';
  import python from 'highlight.js/lib/languages/python';
  import java from 'highlight.js/lib/languages/java';
  import c from 'highlight.js/lib/languages/c';
  import cpp from 'highlight.js/lib/languages/cpp';
  import csharp from 'highlight.js/lib/languages/csharp';
  import go from 'highlight.js/lib/languages/go';
  import rust from 'highlight.js/lib/languages/rust';
  import ruby from 'highlight.js/lib/languages/ruby';
  import php from 'highlight.js/lib/languages/php';
  import swift from 'highlight.js/lib/languages/swift';
  import kotlin from 'highlight.js/lib/languages/kotlin';
  import sql from 'highlight.js/lib/languages/sql';
  import xml from 'highlight.js/lib/languages/xml';
  import css from 'highlight.js/lib/languages/css';
  import scss from 'highlight.js/lib/languages/scss';
  import json from 'highlight.js/lib/languages/json';
  import yaml from 'highlight.js/lib/languages/yaml';
  import bash from 'highlight.js/lib/languages/bash';
  import powershell from 'highlight.js/lib/languages/powershell';
  import dockerfile from 'highlight.js/lib/languages/dockerfile';
  import markdown from 'highlight.js/lib/languages/markdown';
  import plaintext from 'highlight.js/lib/languages/plaintext';
  import diff from 'highlight.js/lib/languages/diff';
  import ini from 'highlight.js/lib/languages/ini';
  import makefile from 'highlight.js/lib/languages/makefile';
  import nginx from 'highlight.js/lib/languages/nginx';
  import shell from 'highlight.js/lib/languages/shell';
  import graphql from 'highlight.js/lib/languages/graphql';

  // --------------------------------------------------------------------------
  // [SECTION] Register Languages
  // --------------------------------------------------------------------------

  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('js', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('ts', typescript);
  hljs.registerLanguage('python', python);
  hljs.registerLanguage('py', python);
  hljs.registerLanguage('java', java);
  hljs.registerLanguage('c', c);
  hljs.registerLanguage('cpp', cpp);
  hljs.registerLanguage('c++', cpp);
  hljs.registerLanguage('csharp', csharp);
  hljs.registerLanguage('cs', csharp);
  hljs.registerLanguage('go', go);
  hljs.registerLanguage('golang', go);
  hljs.registerLanguage('rust', rust);
  hljs.registerLanguage('rs', rust);
  hljs.registerLanguage('ruby', ruby);
  hljs.registerLanguage('rb', ruby);
  hljs.registerLanguage('php', php);
  hljs.registerLanguage('swift', swift);
  hljs.registerLanguage('kotlin', kotlin);
  hljs.registerLanguage('kt', kotlin);
  hljs.registerLanguage('sql', sql);
  hljs.registerLanguage('xml', xml);
  hljs.registerLanguage('html', xml);
  hljs.registerLanguage('svg', xml);
  hljs.registerLanguage('css', css);
  hljs.registerLanguage('scss', scss);
  hljs.registerLanguage('sass', scss);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('yaml', yaml);
  hljs.registerLanguage('yml', yaml);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('sh', bash);
  hljs.registerLanguage('zsh', bash);
  hljs.registerLanguage('powershell', powershell);
  hljs.registerLanguage('ps1', powershell);
  hljs.registerLanguage('dockerfile', dockerfile);
  hljs.registerLanguage('docker', dockerfile);
  hljs.registerLanguage('markdown', markdown);
  hljs.registerLanguage('md', markdown);
  hljs.registerLanguage('plaintext', plaintext);
  hljs.registerLanguage('text', plaintext);
  hljs.registerLanguage('diff', diff);
  hljs.registerLanguage('ini', ini);
  hljs.registerLanguage('toml', ini);
  hljs.registerLanguage('makefile', makefile);
  hljs.registerLanguage('make', makefile);
  hljs.registerLanguage('nginx', nginx);
  hljs.registerLanguage('shell', shell);
  hljs.registerLanguage('console', shell);
  hljs.registerLanguage('graphql', graphql);
  hljs.registerLanguage('gql', graphql);

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Props {
    content: string;
    showLineNumbers?: boolean;
  }

  let { content, showLineNumbers = true }: Props = $props();

  let previewContainer: HTMLDivElement;

  // --------------------------------------------------------------------------
  // [SECTION] Marked Configuration with Highlight.js
  // --------------------------------------------------------------------------

  // [*] Custom renderer for code blocks with syntax highlighting
  const renderer = new marked.Renderer();

  renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    const highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;

    // [*] Split highlighted code into lines and wrap each with line number
    const lines = highlighted.split('\n');
    const codeLines = lines
      .map((line, i) => {
        const lineNum = showLineNumbers ? `<span class="line-number">${i + 1}</span>` : '';
        return `<span class="code-line">${lineNum}<span class="line-content">${line || ' '}</span></span>`;
      })
      .join('');

    return `<div class="code-block-wrapper" data-language="${language}">
      <div class="code-block-header">
        <span class="code-language">${language}</span>
        <button class="copy-button" aria-label="Copy code" title="Copy code">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          <span class="copy-text">Copy</span>
        </button>
      </div>
      <pre class="hljs${showLineNumbers ? ' with-line-numbers' : ''}"><code class="language-${language}">${codeLines}</code></pre>
    </div>`;
  };

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  marked.use({ renderer });

  // --------------------------------------------------------------------------
  // [SECTION] KaTeX Math Rendering
  // --------------------------------------------------------------------------

  /**
   * Renders LaTeX math expressions using KaTeX.
   * Supports both inline ($...$) and display ($$...$$) modes.
   *
   * @param text - The input text with LaTeX expressions
   * @returns The text with rendered KaTeX HTML
   */
  function renderMath(text: string): string {
    // [*] Process display math first ($$...$$) to avoid conflicts with inline
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch (error) {
        console.warn('[PreviewPanel] KaTeX display math error:', error);
        return `<span class="katex-error" title="Invalid LaTeX">$$${math}$$</span>`;
      }
    });

    // [*] Process inline math ($...$)
    // Use negative lookbehind to avoid matching escaped dollars or $$
    text = text.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch (error) {
        console.warn('[PreviewPanel] KaTeX inline math error:', error);
        return `<span class="katex-error" title="Invalid LaTeX">$${math}$</span>`;
      }
    });

    return text;
  }

  // --------------------------------------------------------------------------
  // [SECTION] Content Processing
  // --------------------------------------------------------------------------

  function renderContent(markdown: string): string {
    if (!markdown || !markdown.trim()) {
      return '<p class="text-muted-foreground italic">Preview will appear here...</p>';
    }

    try {
      // [*] Step 1: Render math expressions before markdown parsing
      // This preserves LaTeX syntax that might be altered by markdown processing
      const withMath = renderMath(markdown);

      // [*] Step 2: Parse markdown to HTML
      const html = marked.parse(withMath) as string;
      return html;
    } catch (error) {
      console.error('[PreviewPanel] Render failed:', error);
      return `<p class="text-destructive">Failed to render preview</p>`;
    }
  }

  let renderedContent = $derived(browser ? renderContent(content) : '');

  // --------------------------------------------------------------------------
  // [SECTION] Copy Button Handler
  // --------------------------------------------------------------------------

  function setupCopyButtons() {
    if (!browser || !previewContainer) return;

    const copyButtons = previewContainer.querySelectorAll('.copy-button');
    copyButtons.forEach((button) => {
      button.addEventListener('click', handleCopyClick);
    });
  }

  async function handleCopyClick(event: Event) {
    const button = event.currentTarget as HTMLButtonElement;
    const wrapper = button.closest('.code-block-wrapper');
    if (!wrapper) return;

    const codeElement = wrapper.querySelector('code');
    if (!codeElement) return;

    // [*] Get text content without line numbers
    const code = codeElement.textContent || '';

    try {
      await navigator.clipboard.writeText(code);

      // [*] Show success feedback
      const copyText = button.querySelector('.copy-text');
      if (copyText) {
        copyText.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          copyText.textContent = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      }
    } catch (err) {
      console.error('[PreviewPanel] Copy failed:', err);
    }
  }

  // [*] Setup copy buttons after content renders
  $effect(() => {
    if (renderedContent && browser) {
      // [*] Use setTimeout to ensure DOM is updated
      setTimeout(setupCopyButtons, 0);
    }
  });

  onMount(() => {
    setupCopyButtons();
  });
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
    bind:this={previewContainer}
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
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  /* -------------------------------------------------------------------------- */
  /* [SECTION] Code Block Wrapper */
  /* -------------------------------------------------------------------------- */

  .preview-content :global(.code-block-wrapper) {
    position: relative;
    margin: 1rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }

  .preview-content :global(.code-block-header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: #2d2d2d;
    border-bottom: 1px solid #404040;
  }

  .preview-content :global(.code-language) {
    font-size: 0.75rem;
    font-weight: 500;
    color: #a0a0a0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preview-content :global(.copy-button) {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    color: #a0a0a0;
    background: transparent;
    border: 1px solid #404040;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .preview-content :global(.copy-button:hover) {
    color: #ffffff;
    background-color: #404040;
    border-color: #505050;
  }

  .preview-content :global(.copy-button.copied) {
    color: #4ade80;
    border-color: #4ade80;
  }

  .preview-content :global(.copy-text) {
    font-family: inherit;
  }

  /* -------------------------------------------------------------------------- */
  /* [SECTION] Code Block Pre/Code Styling */
  /* -------------------------------------------------------------------------- */

  .preview-content :global(pre.hljs) {
    margin: 0;
    padding: 1rem;
    background-color: #1e1e1e;
    overflow-x: auto;
    border-radius: 0;
  }

  .preview-content :global(pre.hljs code) {
    display: block;
    background: none;
    padding: 0;
    color: #d4d4d4;
    font-size: 0.875rem;
    line-height: 1.6;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  /* -------------------------------------------------------------------------- */
  /* [SECTION] Line Numbers */
  /* -------------------------------------------------------------------------- */

  .preview-content :global(.code-line) {
    display: block;
  }

  .preview-content :global(.line-number) {
    display: inline-block;
    width: 3rem;
    padding-right: 1rem;
    text-align: right;
    color: #606060;
    user-select: none;
    border-right: 1px solid #404040;
    margin-right: 1rem;
  }

  .preview-content :global(.line-content) {
    white-space: pre;
  }

  /* -------------------------------------------------------------------------- */
  /* [SECTION] Highlight.js Theme (GitHub Dark) */
  /* -------------------------------------------------------------------------- */

  .preview-content :global(.hljs-comment),
  .preview-content :global(.hljs-quote) {
    color: #6a9955;
    font-style: italic;
  }

  .preview-content :global(.hljs-keyword),
  .preview-content :global(.hljs-selector-tag),
  .preview-content :global(.hljs-literal) {
    color: #569cd6;
  }

  .preview-content :global(.hljs-name),
  .preview-content :global(.hljs-selector-id),
  .preview-content :global(.hljs-selector-class) {
    color: #9cdcfe;
  }

  .preview-content :global(.hljs-variable),
  .preview-content :global(.hljs-template-variable) {
    color: #9cdcfe;
  }

  .preview-content :global(.hljs-string),
  .preview-content :global(.hljs-doctag) {
    color: #ce9178;
  }

  .preview-content :global(.hljs-title),
  .preview-content :global(.hljs-section),
  .preview-content :global(.hljs-type),
  .preview-content :global(.hljs-class .hljs-title) {
    color: #4ec9b0;
  }

  .preview-content :global(.hljs-tag),
  .preview-content :global(.hljs-attr) {
    color: #9cdcfe;
  }

  .preview-content :global(.hljs-attribute),
  .preview-content :global(.hljs-symbol),
  .preview-content :global(.hljs-bullet),
  .preview-content :global(.hljs-built_in),
  .preview-content :global(.hljs-addition),
  .preview-content :global(.hljs-link) {
    color: #dcdcaa;
  }

  .preview-content :global(.hljs-number) {
    color: #b5cea8;
  }

  .preview-content :global(.hljs-meta) {
    color: #d7ba7d;
  }

  .preview-content :global(.hljs-emphasis) {
    font-style: italic;
  }

  .preview-content :global(.hljs-strong) {
    font-weight: bold;
  }

  .preview-content :global(.hljs-deletion) {
    color: #f44747;
  }

  .preview-content :global(.hljs-function) {
    color: #dcdcaa;
  }

  .preview-content :global(.hljs-params) {
    color: #9cdcfe;
  }

  .preview-content :global(.hljs-property) {
    color: #9cdcfe;
  }

  .preview-content :global(.hljs-punctuation) {
    color: #d4d4d4;
  }

  .preview-content :global(.hljs-operator) {
    color: #d4d4d4;
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

  /* -------------------------------------------------------------------------- */
  /* [SECTION] KaTeX Math Styling */
  /* -------------------------------------------------------------------------- */

  /* [*] Display math - centered block equations */
  .preview-content :global(.katex-display) {
    display: block;
    text-align: center;
    margin: 1.5rem 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.5rem 0;
  }

  .preview-content :global(.katex-display > .katex) {
    display: inline-block;
    text-align: initial;
  }

  /* [*] Inline math */
  .preview-content :global(.katex) {
    font-size: 1.1em;
    color: inherit;
  }

  /* [*] Dark mode adjustments for KaTeX */
  :global(.dark) .preview-content :global(.katex) {
    color: #e5e7eb;
  }

  :global(.dark) .preview-content :global(.katex-display) {
    background-color: rgba(30, 30, 30, 0.3);
    border-radius: 0.375rem;
  }

  /* [*] Error styling for invalid LaTeX */
  .preview-content :global(.katex-error) {
    color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875rem;
    border: 1px dashed #ef4444;
  }

  :global(.dark) .preview-content :global(.katex-error) {
    background-color: rgba(239, 68, 68, 0.2);
  }
</style>
