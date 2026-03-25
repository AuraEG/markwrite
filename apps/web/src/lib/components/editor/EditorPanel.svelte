<script lang="ts">
  // ==========================================================================
  // File    : EditorPanel.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Main editor panel with textarea (placeholder for Tiptap).
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  // --------------------------------------------------------------------------
  // [SECTION] Props
  // --------------------------------------------------------------------------

  interface Props {
    content: string;
    readonly?: boolean;
    placeholder?: string;
  }

  let {
    content = $bindable(''),
    readonly = false,
    placeholder = 'Start writing...',
  }: Props = $props();
</script>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Editor Panel -->
<!-- -------------------------------------------------------------------------- -->

<div class="flex h-full flex-col">
  <!-- Toolbar Placeholder (will be replaced with Tiptap toolbar) -->
  <div class="border-border bg-muted/30 flex h-10 items-center gap-1 border-b px-2">
    <span class="text-muted-foreground text-xs">
      {#if readonly}
        Read-only mode
      {:else}
        Editor toolbar (Tiptap integration pending)
      {/if}
    </span>
  </div>

  <!-- Editor Content Area -->
  <div class="relative flex-1">
    <textarea
      bind:value={content}
      disabled={readonly}
      {placeholder}
      class="h-full w-full resize-none border-0 bg-transparent p-6 font-mono text-sm leading-relaxed focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
      spellcheck="true"
    ></textarea>

    <!-- Line Numbers Gutter (decorative) -->
    <div
      class="border-border bg-muted/20 text-muted-foreground/50 pointer-events-none absolute left-0 top-0 hidden h-full w-12 select-none border-r pt-6 text-right text-xs lg:block"
    >
      {#each { length: Math.max(content.split('\n').length, 20) } as _, i}
        <div class="h-[1.625rem] pr-2">{i + 1}</div>
      {/each}
    </div>
  </div>
</div>

<style>
  textarea {
    /* Add left padding for line numbers on larger screens */
    @media (min-width: 1024px) {
      padding-left: 4rem;
    }
  }
</style>
