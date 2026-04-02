# cc-auth-switcher

Switch between two Claude Code accounts in one command. So simple Claude can do it for you.

No dependencies. No config files. No dashboard. Just shell aliases and symlinks.

## Why

You have two Claude Code subscriptions and want to spread your usage across both to avoid rate limits. Every existing tool for this is 175+ npm packages when the actual mechanism is one environment variable.

## How it works

Claude Code stores everything in `~/.claude/`. This tool creates two profile directories (`~/.claude-account1`, `~/.claude-account2`) that **symlink back** to your real `~/.claude/` for all shared config. The only file that stays separate is `.credentials.json` — your auth token.

```
~/.claude/                  # Your real config (source of truth)
~/.claude-account1/         # Symlinks to ~/.claude/* + own .credentials.json
~/.claude-account2/         # Symlinks to ~/.claude/* + own .credentials.json
```

Settings, memory, hooks, projects — all shared. Just the login is different.

## Install

```bash
git clone https://github.com/matthew-plusprogramming/cc-auth-switcher.git
cd cc-auth-switcher
chmod +x cc-switch
sudo cp cc-switch /usr/local/bin/
```

Or just copy the script. It's one file. You could probably tattoo it on your forearm and still have room for a semicolon.

## Setup

```bash
cc-switch setup
```

This will:
1. Create `~/.claude-account1` and `~/.claude-account2` with symlinks
2. Add `claude1` and `claude2` aliases to your shell rc

Then:

```bash
source ~/.zshrc          # load the aliases

claude1                  # log in with account 1
claude2                  # log in with account 2
```

From now on, use `claude1` or `claude2` instead of `claude`. When one account hits rate limits, switch to the other. Revolutionary technology.

> **Note:** Running plain `claude` still uses your original `~/.claude/` config — it's completely separate from `claude1` and `claude2`. If you want `claude` to default to one of your accounts, add this to your shell rc:
> ```bash
> alias claude='claude1'
> ```

## Commands

| Command | What it does |
|---------|-------------|
| `cc-switch setup` | Create profiles and install aliases |
| `cc-switch list` | Show which accounts are logged in |
| `cc-switch sync` | Re-sync symlinks (if Claude adds new config files) |
| `cc-switch uninstall` | Remove profiles and aliases |

## FAQ

**Q: Will my settings be different between accounts?**
No. Everything is symlinked. Both accounts share the same settings, memory, hooks, and project config. Only the auth token is separate.

**Q: Do I need to re-run setup after updating Claude Code?**
Only if Claude adds new top-level files to `~/.claude/`. Run `cc-switch sync` to pick them up.

**Q: Can I add more than 2 accounts?**
The script is 130 lines of bash. You'll figure it out.

**Q: Why not use [other tool]?**
Because you read the source code of this one in 2 minutes and mass-reviewed its entire supply chain by the time you finished this sentence.

## License

MIT
