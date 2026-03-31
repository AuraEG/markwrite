<script lang="ts">
  // ==========================================================================
  // File    : Navbar.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : Application navigation bar with user menu and branding.
  //
  // Author  : AuraEG Team
  // Created : 2026-03-25
  // ==========================================================================

  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Avatar from '$lib/components/ui/avatar';
  import FileText from '@lucide/svelte/icons/file-text';
  import LogOut from '@lucide/svelte/icons/log-out';
  import User from '@lucide/svelte/icons/user';
  import Settings from '@lucide/svelte/icons/settings';
  import { fade } from 'svelte/transition';

  interface Props {
    user: {
      username: string;
      avatarUrl?: string | null;
    } | null;
  }

  let { user }: Props = $props();
</script>

<header
  class="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-sm"
  in:fade={{ duration: 200 }}
>
  <div class="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
    <!-- -------------------------------------------------------------------------- -->
    <!-- [SECTION] Logo -->
    <!-- -------------------------------------------------------------------------- -->
    <a href="/" class="flex items-center gap-2 transition-opacity hover:opacity-80">
      <div class="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
        <FileText class="text-primary-foreground h-5 w-5" />
      </div>
      <span class="text-xl font-bold">
        Mark<span class="text-primary">Write</span>
      </span>
    </a>

    <!-- -------------------------------------------------------------------------- -->
    <!-- [SECTION] Navigation & User Menu -->
    <!-- -------------------------------------------------------------------------- -->
    <nav class="flex items-center gap-4">
      {#if user}
        <Button variant="ghost" href="/documents" class="hidden sm:inline-flex">
          <FileText class="mr-2 h-4 w-4" />
          Documents
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="relative h-10 w-10 rounded-full">
            <Avatar.Root class="h-10 w-10">
              {#if user.avatarUrl}
                <Avatar.Image src={user.avatarUrl} alt={user.username} />
              {/if}
              <Avatar.Fallback class="bg-primary/10 text-primary">
                {user.username.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="w-56" align="end">
            <DropdownMenu.Label class="font-normal">
              <div class="flex flex-col space-y-1">
                <p class="text-sm font-medium leading-none">{user.username}</p>
                <p class="text-muted-foreground text-xs leading-none">Signed in with GitHub</p>
              </div>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              <DropdownMenu.Item>
                <User class="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <Settings class="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <form action="/auth/logout" method="POST" class="w-full">
              <DropdownMenu.Item
                class="text-destructive focus:text-destructive w-full cursor-pointer"
                onclick={(e: MouseEvent) => {
                  e.preventDefault();
                  const form = (e.currentTarget as HTMLElement).closest('form');
                  form?.submit();
                }}
              >
                <LogOut class="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenu.Item>
            </form>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {:else}
        <Button href="/auth/github" variant="default">
          <svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          Sign in
        </Button>
      {/if}
    </nav>
  </div>
</header>
