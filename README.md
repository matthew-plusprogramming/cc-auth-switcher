# cc-auth-switcher

Switch between Claude Code accounts in one command. So simple Claude can do it for you.

No dependencies. No config files. No dashboard. Just shell aliases and symlinks.

## Why

You have multiple Claude Code subscriptions and want to spread your usage across them to avoid rate limits. Every existing tool for this is 175+ npm packages when the actual mechanism is one environment variable.

## How it works

Claude Code stores everything in `~/.claude/`. This tool creates profile directories (e.g. `~/.claude-work`, `~/.claude-personal`) that **symlink back** to your real `~/.claude/` for all shared config. The only file that stays separate is `.credentials.json` — your auth token.

```
~/.claude/                  # Your real config (source of truth)
~/.claude-work/             # Symlinks to ~/.claude/* + own .credentials.json
~/.claude-personal/         # Symlinks to ~/.claude/* + own .credentials.json
```

Settings, memory, hooks, projects — all shared. Just the login is different.

## Install

```bash
git clone https://github.com/matthew-plusprogramming/cc-auth-switcher.git
cd cc-auth-switcher
chmod +x cc-switch
sudo cp cc-switch /usr/local/bin/
```

Or just copy the script. It's one file.

## Usage

### Add accounts

```bash
cc-switch add work          # creates 'work' alias
cc-switch add personal      # creates 'personal' alias
cc-switch add client-x      # add as many as you want
```

### Log in

```bash
source ~/.zshrc             # load the new aliases
work                        # log in with account 1
personal                    # log in with account 2
```

### Switch — two options

**Option A: Named aliases** (each gets its own isolated config dir)

```bash
work                        # launches claude with work credentials
personal                    # launches claude with personal credentials
```

Each alias uses `CLAUDE_CONFIG_DIR` to point at a separate profile directory. You can run them side by side in different terminals without conflict.

**Option B: In-place swap** (simplest — just use plain `claude`)

```bash
cc-switch swap work         # swaps ~/.claude credentials to work account
claude                      # now uses work credentials

cc-switch swap personal     # swap again
claude                      # now uses personal credentials
```

This swaps credentials in and out of `~/.claude/`. When you swap to a new profile, your current credentials are **automatically saved back** to the profile you were on. Plain `claude` just works with whichever account you last swapped to.

**First-time swap** — since there's no marker yet, you need to tell it which profile you're currently on:

```bash
cc-switch swap --from work personal   # "I'm on work, switch to personal"
```

After the first swap, the marker is set and future swaps save back automatically:

```bash
cc-switch swap work                   # saves personal → ~/.claude-personal, loads work
cc-switch swap personal               # saves work → ~/.claude-work, loads personal
```

If you don't care about saving the current credentials (e.g. they're expired):

```bash
cc-switch swap --force work           # just overwrite, don't save back
```

### Manage

```bash
cc-switch list              # show accounts and login status
cc-switch sync              # re-sync symlinks after Claude updates
cc-switch remove client-x   # remove a profile
cc-switch uninstall         # remove everything
```

## Token refresh

Inactive profiles' OAuth tokens will expire if not refreshed. Two options:

1. **[cc-rate-balancer](https://github.com/matthew-plusprogramming/cc-rate-balancer)** (recommended) — runs a minimal Claude Code session against each inactive profile every 30 minutes, letting CC refresh its own tokens. Also monitors rate limits and auto-swaps profiles.

2. **Manual** — just run the alias (e.g. `work`) periodically. Claude Code refreshes its token on startup.

## FAQ

**Q: Will my settings be different between accounts?**
No. Everything is symlinked. All accounts share the same settings, memory, hooks, and project config. Only the auth token is separate.

**Q: Aliases or swap — which should I use?**
Use **aliases** if you want to run multiple accounts simultaneously in different terminals. Use **swap** if you just want the simplest possible flow with plain `claude`.

**Q: Do I need to re-run anything after updating Claude Code?**
Only if Claude adds new top-level files to `~/.claude/`. Run `cc-switch sync` to pick them up.

**Q: Why not use [other tool]?**
Because you read the source code of this one in 2 minutes and mass-reviewed its entire supply chain by the time you finished this sentence.

## License

MIT
