<script lang="ts">
  // ==========================================================================
  // File    : MarkdownToolbar.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Toolbar with formatting buttons for the markdown editor.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-26
  // ==========================================================================

  import { Button } from '$lib/components/ui/button';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import Bold from '@lucide/svelte/icons/bold';
  import Italic from '@lucide/svelte/icons/italic';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import Code from '@lucide/svelte/icons/code';
  import Heading1 from '@lucide/svelte/icons/heading-1';
  import Heading2 from '@lucide/svelte/icons/heading-2';
  import Heading3 from '@lucide/svelte/icons/heading-3';
  import List from '@lucide/svelte/icons/list';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import Quote from '@lucide/svelte/icons/quote';
  import Minus from '@lucide/svelte/icons/minus';
  import Link from '@lucide/svelte/icons/link';
  import Image from '@lucide/svelte/icons/image';
  import FileCode from '@lucide/svelte/icons/file-code';
  import Undo from '@lucide/svelte/icons/undo';
  import Redo from '@lucide/svelte/icons/redo';

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Props {
    readonly?: boolean;
    onAction?: (
      actionType: 'wrap' | 'linePrefix' | 'insert',
      before: string,
      after?: string,
      placeholder?: string
    ) => void;
    onUndo?: () => void;
    onRedo?: () => void;
  }

  let { readonly = false, onAction, onUndo, onRedo }: Props = $props();

  // --------------------------------------------------------------------------
  // [SECTION] Toolbar Actions
  // --------------------------------------------------------------------------

  type ActionType = 'wrap' | 'linePrefix' | 'insert';

  interface ToolbarAction {
    icon: typeof Bold;
    label: string;
    before: string;
    after?: string;
    placeholder?: string;
    actionType: ActionType;
  }

  interface Separator {
    type: 'separator';
  }

  const actions: (ToolbarAction | Separator)[] = [
    // [*] Wrap actions - wrap selected text
    {
      icon: Bold,
      label: 'Bold',
      before: '**',
      after: '**',
      placeholder: 'bold text',
      actionType: 'wrap',
    },
    {
      icon: Italic,
      label: 'Italic',
      before: '*',
      after: '*',
      placeholder: 'italic text',
      actionType: 'wrap',
    },
    {
      icon: Strikethrough,
      label: 'Strikethrough',
      before: '~~',
      after: '~~',
      placeholder: 'strikethrough',
      actionType: 'wrap',
    },
    {
      icon: Code,
      label: 'Inline Code',
      before: '`',
      after: '`',
      placeholder: 'code',
      actionType: 'wrap',
    },
    { type: 'separator' },
    // [*] Line prefix actions - add prefix at line start
    {
      icon: Heading1,
      label: 'Heading 1',
      before: '# ',
      actionType: 'linePrefix',
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      before: '## ',
      actionType: 'linePrefix',
    },
    {
      icon: Heading3,
      label: 'Heading 3',
      before: '### ',
      actionType: 'linePrefix',
    },
    { type: 'separator' },
    {
      icon: List,
      label: 'Bullet List',
      before: '- ',
      actionType: 'linePrefix',
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      before: '1. ',
      actionType: 'linePrefix',
    },
    {
      icon: Quote,
      label: 'Blockquote',
      before: '> ',
      actionType: 'linePrefix',
    },
    { type: 'separator' },
    // [*] Wrap actions for links/images
    {
      icon: Link,
      label: 'Link',
      before: '[',
      after: '](url)',
      placeholder: 'link text',
      actionType: 'wrap',
    },
    {
      icon: Image,
      label: 'Image',
      before: '![',
      after: '](image-url)',
      placeholder: 'alt text',
      actionType: 'wrap',
    },
    // [*] Insert actions - insert at cursor
    {
      icon: FileCode,
      label: 'Code Block',
      before: '```\n',
      after: '\n```',
      placeholder: 'code',
      actionType: 'insert',
    },
    {
      icon: Minus,
      label: 'Horizontal Rule',
      before: '\n---\n',
      actionType: 'insert',
    },
  ];

  function handleAction(action: ToolbarAction | Separator) {
    if ('type' in action || readonly || !onAction) return;
    onAction(action.actionType, action.before, action.after, action.placeholder);
  }
</script>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Toolbar -->
<!-- -------------------------------------------------------------------------- -->

<div class="border-border bg-muted/30 flex h-10 items-center gap-0.5 border-b px-2">
  <!-- Undo/Redo -->
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          disabled={readonly}
          onclick={() => onUndo?.()}
        >
          <Undo class="h-4 w-4" />
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Undo</Tooltip.Content>
  </Tooltip.Root>

  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          disabled={readonly}
          onclick={() => onRedo?.()}
        >
          <Redo class="h-4 w-4" />
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Redo</Tooltip.Content>
  </Tooltip.Root>

  <div class="bg-border mx-1 h-6 w-px"></div>

  <!-- Formatting Actions -->
  {#each actions as action}
    {#if 'type' in action && action.type === 'separator'}
      <div class="bg-border mx-1 h-6 w-px"></div>
    {:else if 'icon' in action}
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              disabled={readonly}
              onclick={() => handleAction(action)}
            >
              <action.icon class="h-4 w-4" />
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>{action.label}</Tooltip.Content>
      </Tooltip.Root>
    {/if}
  {/each}
</div>
