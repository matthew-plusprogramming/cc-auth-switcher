# cc-auth-switcher

Switch between Claude Code accounts on macOS, keeping each account's own
subscription.

Each profile is a `CLAUDE_CONFIG_DIR` with its own native Claude Code login.
Claude Code owns the credential; `cc-switch` only decides which config dir a
launch uses. Nothing copies, edits, or guesses credential storage.

## Why not setup-token

An earlier version of this tool switched accounts by injecting a
`claude setup-token` token as `CLAUDE_CODE_OAUTH_TOKEN`. That does not work for
interactive use, because the environment variable **overrides** the interactive
login:

```text
no token   -> authMethod: claude.ai,    subscriptionType: max   ("Claude Max")
with token -> authMethod: oauth_token,  no account, no plan     ("Claude API")
```

The keychain login is not deleted, it is shadowed. So `/login` appears to work,
but only for that one process — the next launch injects the token again and the
session is back to token auth, billed as API rather than against your
subscription. Setup-token auth is still the right tool for headless and CI use,
where there is no interactive login to shadow.

`CLAUDE_CONFIG_DIR` was never the thing that broke. Copying credential blobs
between keychain items was. This version keeps the config dirs and drops the
copying.

## Install

```bash
git clone https://github.com/matthew-plusprogramming/cc-auth-switcher.git
cd cc-auth-switcher
chmod +x cc-switch
ln -s "$PWD/cc-switch" ~/.local/bin/cc-switch
```

## Setup

Create a profile and sign it in:

```bash
cc-switch add cc1
cc-switch login cc1
```

`login` opens the normal browser sign-in against that profile's config dir, so
the profile keeps its own account and its own subscription. Repeat per account:

```bash
cc-switch add cc2
cc-switch login cc2
```

Install the shell aliases and the plain `claude` wrapper:

```bash
cc-switch shell-setup
source ~/.zshrc
```

## Usage

Run a specific profile:

```bash
cc1                          # alias for: cc-switch run cc1
cc-switch run cc2 -p "hi" --max-turns 1
```

Switch which account plain `claude` uses:

```bash
cc-switch use cc1            # plain 'claude' now runs as cc1
cc-switch use default        # plain 'claude' back to your ~/.claude login
```

`default` is a reserved profile name that maps to `~/.claude`. It is the
fallback whenever no active profile is set, so plain `claude` always works.

Check what is signed in where:

```bash
cc-switch list
cc-switch validate --all
cc-switch doctor
```

`list` shows each profile's account email and plan, so you can confirm two
profiles really are two different accounts.

## Headless and CI

For non-interactive use, a profile can carry a `setup-token` token:

```bash
"$(cc-switch claude-bin)" setup-token
cc-switch token add cc1
cc-switch run --token cc1 -p "hi" --max-turns 1
```

Token runs are billed as API usage and carry no subscription. `run` only uses a
token when you pass `--token`, so interactive launches can never silently fall
back to API billing.

## What is shared between profiles

`add` and `sync` symlink your settings, memory, hooks, agents, commands, skills,
plugins, and projects from `~/.claude` into each profile dir, so all accounts
share one configuration.

Each profile keeps its own:

- account credential (`.credentials.json` plus its own keychain item)
- `.claude.json` state
- MCP OAuth tokens

Run `cc-switch sync` after Claude Code adds new config files.

## Storage

Claude Code names its macOS keychain item after the config dir path:

```text
~/.claude          -> Claude Code-credentials
~/.claude-<name>   -> Claude Code-credentials-<first 8 hex of sha256(path)>
```

`cc-switch` never reads or writes those items. It only sets `CLAUDE_CONFIG_DIR`
and lets Claude Code manage its own credential. Setup-token tokens, when used,
are stored separately under the service `cc-auth-switcher-token` and are never
printed.

## Troubleshooting

**A session shows "Claude API" or "API Usage Billing" instead of your plan.**
Something set `CLAUDE_CODE_OAUTH_TOKEN` in that shell, or the profile is not
signed in. `cc-switch doctor` warns when the variable is set. `run` strips it
from every non-token launch, so this should only come from a shell you exported
it in yourself.

**A profile says "logged out".** Run `cc-switch login <name>`.

**Plain `claude` stopped working.** `run-active` falls back to `~/.claude` if the
active profile has no config dir, so this should not happen. To remove the
wrapper entirely, delete the `# cc-switch: claude-wrapper` line from your shell
rc.

## Migration from the setup-token version

```bash
cc-switch add cc1 && cc-switch login cc1
cc-switch add cc2 && cc-switch login cc2
cc-switch use default
```

If a profile was previously managed by the credential-copying version, its old
`.credentials.json` and keychain item may hold a stale or duplicated credential.
Clear those before signing in, or the profile can start in a confusing
half-authenticated state.

## License

MIT
