<script lang="ts">
  // ==========================================================================
  // File    : +page.svelte
  // Project : MarkWrite
  // Layer   : Presentation
  // Purpose : User profile and settings page with tabbed interface.
  //
  // Author  : AuraEG Team
  // Created : 2026-04-02
  // ==========================================================================

  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { Slider } from '$lib/components/ui/slider';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { Navbar } from '$lib/components/layout';

  // --------------------------------------------------------------------------
  // [SECTION] Props & State
  // --------------------------------------------------------------------------

  let { data } = $props();

  let loading = $state(true);
  let saving = $state(false);
  let activeTab = $state('profile');

  // Profile data
  let profile = $state({
    username: '',
    email: '',
    avatarUrl: '',
    createdAt: '',
  });

  // Stats
  let stats = $state({
    ownedDocuments: 0,
    collaborations: 0,
  });

  // Settings state
  let theme = $state('system');
  let fontSize = $state(14);
  let fontFamily = $state('mono');
  let tabSize = $state('2');
  let lineWrapping = $state(true);
  let autoSaveInterval = $state(30);
  let spellCheck = $state(false);
  let showLineNumbers = $state(true);

  // --------------------------------------------------------------------------
  // [SECTION] Data Fetching
  // --------------------------------------------------------------------------

  async function fetchSettings() {
    try {
      const response = await fetch('/api/user/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();

      profile = data.profile;
      stats = data.stats;

      // Set individual settings
      theme = data.settings.theme;
      fontSize = data.settings.fontSize;
      fontFamily = data.settings.fontFamily;
      tabSize = String(data.settings.tabSize);
      lineWrapping = data.settings.lineWrapping;
      autoSaveInterval = data.settings.autoSaveInterval;
      spellCheck = data.settings.spellCheck;
      showLineNumbers = data.settings.showLineNumbers;
    } catch (error) {
      console.error('[Settings] Failed to fetch:', error);
      toast.error('Failed to load settings');
    } finally {
      loading = false;
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION] Settings Update
  // --------------------------------------------------------------------------

  async function saveSettings() {
    saving = true;
    try {
      const settingsUpdate = {
        theme,
        fontSize,
        fontFamily,
        tabSize: Number(tabSize),
        lineWrapping,
        autoSaveInterval,
        spellCheck,
        showLineNumbers,
      };

      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[Settings] Save failed:', response.status, errorData);
        throw new Error(errorData.message || `Failed to save settings (${response.status})`);
      }

      const data = await response.json();

      // [*] Update settings store
      settingsStore.updateLocal(data.settings);

      // [*] Apply theme immediately
      themeStore.setTheme(theme as 'light' | 'dark' | 'system');

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('[Settings] Failed to save:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      saving = false;
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getFontLabel(font: string): string {
    const labels: Record<string, string> = {
      mono: 'System Mono',
      jetbrains: 'JetBrains Mono',
      fira: 'Fira Code',
      source: 'Source Code Pro',
    };
    return labels[font] || font;
  }

  function getThemeLabel(t: string): string {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  onMount(() => {
    fetchSettings();
  });
</script>

<!-- -------------------------------------------------------------------------- -->
<!-- [SECTION] Page Layout -->
<!-- -------------------------------------------------------------------------- -->

<svelte:head>
  <title>Settings - MarkWrite</title>
</svelte:head>

<Navbar user={data.user} />

<main class="container mx-auto max-w-4xl px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold">Settings</h1>
    <p class="text-muted-foreground mt-2">Manage your account and editor preferences</p>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div
        class="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
      ></div>
    </div>
  {:else}
    <Tabs.Root bind:value={activeTab} class="space-y-6">
      <Tabs.List class="grid w-full grid-cols-2">
        <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
        <Tabs.Trigger value="editor">Editor Preferences</Tabs.Trigger>
      </Tabs.List>

      <!-- Profile Tab -->
      <Tabs.Content value="profile" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title>Profile Information</Card.Title>
            <Card.Description>Your account details from GitHub</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <div class="flex items-center gap-6">
              {#if profile.avatarUrl}
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  class="border-border h-20 w-20 rounded-full border-2"
                />
              {:else}
                <div
                  class="bg-muted flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold"
                >
                  {profile.username?.charAt(0).toUpperCase() || '?'}
                </div>
              {/if}
              <div>
                <h3 class="text-xl font-semibold">{profile.username}</h3>
                <p class="text-muted-foreground">{profile.email || 'No email provided'}</p>
              </div>
            </div>

            <div class="border-border border-t pt-6">
              <dl class="grid grid-cols-2 gap-4">
                <div>
                  <dt class="text-muted-foreground text-sm">Member since</dt>
                  <dd class="font-medium">{formatDate(profile.createdAt)}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-sm">GitHub Username</dt>
                  <dd class="font-medium">@{profile.username}</dd>
                </div>
              </dl>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Document Statistics</Card.Title>
            <Card.Description>Overview of your documents and collaborations</Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="grid grid-cols-2 gap-6">
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <div class="text-primary text-3xl font-bold">{stats.ownedDocuments}</div>
                <div class="text-muted-foreground text-sm">Documents Created</div>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <div class="text-primary text-3xl font-bold">{stats.collaborations}</div>
                <div class="text-muted-foreground text-sm">Collaborations</div>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Editor Preferences Tab -->
      <Tabs.Content value="editor" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title>Appearance</Card.Title>
            <Card.Description>Customize the look and feel of the editor</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Theme -->
            <div class="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p class="text-muted-foreground text-sm">Select your preferred color scheme</p>
              </div>
              <Select.Root bind:value={theme}>
                <Select.Trigger class="w-40">
                  <Select.Value placeholder="Select theme">{getThemeLabel(theme)}</Select.Value>
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="light">Light</Select.Item>
                  <Select.Item value="dark">Dark</Select.Item>
                  <Select.Item value="system">System</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>

            <!-- Font Size -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <Label>Font Size</Label>
                  <p class="text-muted-foreground text-sm">Adjust the editor font size</p>
                </div>
                <span class="text-muted-foreground text-sm">{fontSize}px</span>
              </div>
              <Slider
                value={[fontSize]}
                min={12}
                max={24}
                step={1}
                onValueChange={(v) => (fontSize = v[0])}
                class="w-full"
              />
            </div>

            <!-- Font Family -->
            <div class="flex items-center justify-between">
              <div>
                <Label>Font Family</Label>
                <p class="text-muted-foreground text-sm">Choose your preferred monospace font</p>
              </div>
              <Select.Root bind:value={fontFamily}>
                <Select.Trigger class="w-40">
                  <Select.Value placeholder="Select font">{getFontLabel(fontFamily)}</Select.Value>
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="mono">System Mono</Select.Item>
                  <Select.Item value="jetbrains">JetBrains Mono</Select.Item>
                  <Select.Item value="fira">Fira Code</Select.Item>
                  <Select.Item value="source">Source Code Pro</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Editor Behavior</Card.Title>
            <Card.Description>Configure how the editor works</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Tab Size -->
            <div class="flex items-center justify-between">
              <div>
                <Label>Tab Size</Label>
                <p class="text-muted-foreground text-sm">Number of spaces per tab</p>
              </div>
              <Select.Root bind:value={tabSize}>
                <Select.Trigger class="w-40">
                  <Select.Value placeholder="Select size">{tabSize} spaces</Select.Value>
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="2">2 spaces</Select.Item>
                  <Select.Item value="4">4 spaces</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>

            <!-- Line Wrapping -->
            <div class="flex items-center justify-between">
              <div>
                <Label>Line Wrapping</Label>
                <p class="text-muted-foreground text-sm">Wrap long lines to fit the editor width</p>
              </div>
              <Switch checked={lineWrapping} onCheckedChange={(v) => (lineWrapping = v)} />
            </div>

            <!-- Show Line Numbers -->
            <div class="flex items-center justify-between">
              <div>
                <Label>Show Line Numbers</Label>
                <p class="text-muted-foreground text-sm">Display line numbers in code blocks</p>
              </div>
              <Switch checked={showLineNumbers} onCheckedChange={(v) => (showLineNumbers = v)} />
            </div>

            <!-- Spell Check -->
            <div class="flex items-center justify-between">
              <div>
                <Label>Spell Check</Label>
                <p class="text-muted-foreground text-sm">Enable browser spell checking</p>
              </div>
              <Switch checked={spellCheck} onCheckedChange={(v) => (spellCheck = v)} />
            </div>

            <!-- Auto-save Interval -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <Label>Auto-save Interval</Label>
                  <p class="text-muted-foreground text-sm">
                    How often to save your work automatically
                  </p>
                </div>
                <span class="text-muted-foreground text-sm">{autoSaveInterval}s</span>
              </div>
              <Slider
                value={[autoSaveInterval]}
                min={10}
                max={120}
                step={10}
                onValueChange={(v) => (autoSaveInterval = v[0])}
                class="w-full"
              />
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Save Button -->
        <div class="flex justify-end">
          <Button onclick={saveSettings} disabled={saving} class="min-w-32">
            {#if saving}
              <span
                class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              ></span>
              Saving...
            {:else}
              Save Changes
            {/if}
          </Button>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  {/if}
</main>
