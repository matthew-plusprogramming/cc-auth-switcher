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

This copies the profile's `.credentials.json` directly into `~/.claude/`. No aliases needed, no env vars — plain `claude` just works with whichever account you last swapped to. One command to switch.

### Manage

```bash
cc-switch list              # show accounts and login status
cc-switch sync              # re-sync symlinks after Claude updates
cc-switch remove client-x   # remove a profile
cc-switch uninstall         # remove everything
```

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
