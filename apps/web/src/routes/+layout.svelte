<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<svelte:head>
  <title>MarkWrite</title>
</svelte:head>

{@render children()}
