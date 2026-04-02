<script lang="ts">
  // ==========================================================================
  // File    : EditorHeader.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Document editor header with title, actions, and collaborator avatars.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // Updated : 2026-03-26 - Added export functionality
  // Updated : 2026-03-31 - Added theme toggle
  // ==========================================================================

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Share2 from '@lucide/svelte/icons/share-2';
  import History from '@lucide/svelte/icons/history';
  import Download from '@lucide/svelte/icons/download';
  import Check from '@lucide/svelte/icons/check';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import FileText from '@lucide/svelte/icons/file-text';
  import Code from '@lucide/svelte/icons/code';
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import Monitor from '@lucide/svelte/icons/monitor';
  import { toast } from 'svelte-sonner';
  import type { Snippet } from 'svelte';
  import { themeStore, type Theme } from '$lib/stores/theme.svelte';

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
    onExportHtml?: () => string;
    onExportMarkdown?: () => string;
    onShare?: () => void;
  }

  let {
    title,
    canEdit,
    isOwner,
    isSaving,
    lastSaved,
    owner,
    collaborators,
    actions,
    onExportHtml,
    onExportMarkdown,
    onShare,
  }: Props = $props();

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

  // --------------------------------------------------------------------------
  // [SECTION] Export Functions
  // --------------------------------------------------------------------------

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleExportHtml() {
    if (!onExportHtml) return;
    const markdown = onExportHtml();

    // [*] Import marked and hljs dynamically for HTML export with syntax highlighting
    const { marked } = await import('marked');
    const hljs = await import('highlight.js/lib/core');

    // [*] Import common languages for export
    const [
      javascript,
      typescript,
      python,
      java,
      cpp,
      go,
      rust,
      ruby,
      php,
      sql,
      xml,
      css,
      json,
      yaml,
      bash,
      dockerfile,
      mdLang,
    ] = await Promise.all([
      import('highlight.js/lib/languages/javascript'),
      import('highlight.js/lib/languages/typescript'),
      import('highlight.js/lib/languages/python'),
      import('highlight.js/lib/languages/java'),
      import('highlight.js/lib/languages/cpp'),
      import('highlight.js/lib/languages/go'),
      import('highlight.js/lib/languages/rust'),
      import('highlight.js/lib/languages/ruby'),
      import('highlight.js/lib/languages/php'),
      import('highlight.js/lib/languages/sql'),
      import('highlight.js/lib/languages/xml'),
      import('highlight.js/lib/languages/css'),
      import('highlight.js/lib/languages/json'),
      import('highlight.js/lib/languages/yaml'),
      import('highlight.js/lib/languages/bash'),
      import('highlight.js/lib/languages/dockerfile'),
      import('highlight.js/lib/languages/markdown'),
    ]);

    // Register languages
    hljs.default.registerLanguage('javascript', javascript.default);
    hljs.default.registerLanguage('js', javascript.default);
    hljs.default.registerLanguage('typescript', typescript.default);
    hljs.default.registerLanguage('ts', typescript.default);
    hljs.default.registerLanguage('python', python.default);
    hljs.default.registerLanguage('java', java.default);
    hljs.default.registerLanguage('cpp', cpp.default);
    hljs.default.registerLanguage('go', go.default);
    hljs.default.registerLanguage('rust', rust.default);
    hljs.default.registerLanguage('ruby', ruby.default);
    hljs.default.registerLanguage('php', php.default);
    hljs.default.registerLanguage('sql', sql.default);
    hljs.default.registerLanguage('xml', xml.default);
    hljs.default.registerLanguage('html', xml.default);
    hljs.default.registerLanguage('css', css.default);
    hljs.default.registerLanguage('json', json.default);
    hljs.default.registerLanguage('yaml', yaml.default);
    hljs.default.registerLanguage('bash', bash.default);
    hljs.default.registerLanguage('sh', bash.default);
    hljs.default.registerLanguage('dockerfile', dockerfile.default);
    hljs.default.registerLanguage('markdown', mdLang.default);

    // [*] Custom renderer with syntax highlighting for export
    const renderer = new marked.Renderer();
    renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      const language = lang && hljs.default.getLanguage(lang) ? lang : 'plaintext';
      let highlighted: string;
      try {
        highlighted = hljs.default.highlight(text, { language, ignoreIllegals: true }).value;
      } catch {
        highlighted = text;
      }
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    };

    marked.use({ renderer });
    const html = marked.parse(markdown) as string;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { font-size: 2rem; font-weight: 700; margin-top: 1.5rem; }
    h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1rem; }
    p { margin: 0.75rem 0; }
    ul, ol { padding-left: 1.5rem; }
    blockquote { border-left: 3px solid #ccc; padding-left: 1rem; font-style: italic; color: #666; }
    code { background: #f4f4f4; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: ui-monospace, monospace; font-size: 0.875rem; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; border: 1px solid #333; }
    pre code { background: none; padding: 0; color: inherit; display: block; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f4f4f4; font-weight: 600; }
    a { color: #3b82f6; }
    hr { border: none; border-top: 1px solid #ddd; margin: 1.5rem 0; }
    /* Syntax highlighting - VS Code Dark theme */
    .hljs-comment, .hljs-quote { color: #6a9955; font-style: italic; }
    .hljs-keyword, .hljs-selector-tag, .hljs-literal { color: #569cd6; }
    .hljs-name, .hljs-selector-id, .hljs-selector-class, .hljs-variable { color: #9cdcfe; }
    .hljs-string, .hljs-doctag { color: #ce9178; }
    .hljs-title, .hljs-section, .hljs-type { color: #4ec9b0; }
    .hljs-tag, .hljs-attr { color: #9cdcfe; }
    .hljs-attribute, .hljs-symbol, .hljs-bullet, .hljs-built_in { color: #dcdcaa; }
    .hljs-number { color: #b5cea8; }
    .hljs-meta { color: #d7ba7d; }
    .hljs-function { color: #dcdcaa; }
    .hljs-params { color: #9cdcfe; }
    .hljs-property { color: #9cdcfe; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
    const filename = `${title || 'document'}.html`;
    downloadFile(fullHtml, filename, 'text/html');
    toast.success(`Downloaded ${filename}`);
  }

  function handleExportMarkdown() {
    if (!onExportMarkdown) return;
    const markdown = onExportMarkdown();
    const filename = `${title || 'document'}.md`;
    downloadFile(markdown, filename, 'text/markdown');
    toast.success(`Downloaded ${filename}`);
  }

  function handleThemeChange(newTheme: Theme): void {
    themeStore.setTheme(newTheme);
  }
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

    <!-- Theme Toggle -->
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost" size="icon" class="h-9 w-9" aria-label="Toggle theme">
          {#if themeStore.resolvedTheme === 'light'}
            <Sun class="h-4 w-4" />
          {:else}
            <Moon class="h-4 w-4" />
          {/if}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item class="cursor-pointer" onclick={() => handleThemeChange('light')}>
          <Sun class="mr-2 h-4 w-4" />
          <span>Light</span>
          {#if themeStore.theme === 'light'}
            <span class="ml-auto text-xs">*</span>
          {/if}
        </DropdownMenu.Item>
        <DropdownMenu.Item class="cursor-pointer" onclick={() => handleThemeChange('dark')}>
          <Moon class="mr-2 h-4 w-4" />
          <span>Dark</span>
          {#if themeStore.theme === 'dark'}
            <span class="ml-auto text-xs">*</span>
          {/if}
        </DropdownMenu.Item>
        <DropdownMenu.Item class="cursor-pointer" onclick={() => handleThemeChange('system')}>
          <Monitor class="mr-2 h-4 w-4" />
          <span>System</span>
          {#if themeStore.theme === 'system'}
            <span class="ml-auto text-xs">*</span>
          {/if}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    {#if isOwner}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button variant="ghost" size="icon" class="h-9 w-9" onclick={onShare}>
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

    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost" size="icon" class="h-9 w-9">
          <Download class="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" class="w-44">
        <DropdownMenu.Label>Export As</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={handleExportHtml} class="flex items-center gap-2">
          <Code class="h-4 w-4" />
          <span>HTML</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={handleExportMarkdown} class="flex items-center gap-2">
          <FileText class="h-4 w-4" />
          <span>Markdown</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
</header>
