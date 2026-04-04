#!/usr/bin/env node

// Claude Code OAuth Token Refresh Script
//
// Refreshes OAuth tokens for all cc-auth-switcher profiles before they expire.
// Auto-discovers profiles by scanning for ~/.claude-*/ directories.
// Skips ~/.claude (active session — refreshed automatically by Claude Code).
//
// Cron setup (run every 4 hours):
//   0 */4 * * * /usr/local/bin/node /path/to/cc-auth-switcher/refresh-tokens.mjs >> ~/.claude/logs/token-refresh.log 2>&1
//
// Manual run:
//   node refresh-tokens.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

// --- Constants ---

const OAUTH_TOKEN_URL = 'https://claude.ai/v1/oauth/token';
const OAUTH_CLIENT_ID = 'https://claude.ai/oauth/claude-code-client-metadata';
const REFRESH_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// --- Profile discovery ---

function discoverProfiles() {
  const home = homedir();
  const profiles = [];

  try {
    const entries = readdirSync(home);
    for (const entry of entries) {
      if (!entry.startsWith('.claude-')) continue;
      const dir = join(home, entry);
      try {
        if (!statSync(dir).isDirectory()) continue;
      } catch {
        continue;
      }
      const name = entry.replace(/^\.claude-/, '');
      profiles.push({ name, dir });
    }
  } catch (err) {
    console.error(`[${timestamp()}] ERROR: Cannot read home directory: ${err.message}`);
  }

  return profiles;
}

// --- Helpers ---

function timestamp() {
  return new Date().toISOString();
}

function log(profile, message) {
  console.log(`[${timestamp()}] [${profile}] ${message}`);
}

function logError(profile, message) {
  console.error(`[${timestamp()}] [${profile}] ERROR: ${message}`);
}

function readCredentials(profileDir) {
  const credPath = join(profileDir, '.credentials.json');
  try {
    const raw = readFileSync(credPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCredentials(profileDir, credentials) {
  const credPath = join(profileDir, '.credentials.json');
  writeFileSync(credPath, JSON.stringify(credentials, null, 2) + '\n', {
    mode: 0o600,
  });
}

function needsRefresh(expiresAt) {
  const now = Date.now();
  return expiresAt - now < REFRESH_THRESHOLD_MS;
}

async function requestTokenRefresh(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: OAUTH_CLIENT_ID,
  });

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

// --- Main ---

async function refreshProfile(profile) {
  const { name, dir } = profile;

  const credentials = readCredentials(dir);
  if (!credentials) {
    logError(name, `Cannot read .credentials.json in ${dir} -- skipping`);
    return { name, status: 'skipped', reason: 'unreadable' };
  }

  const oauth = credentials.claudeAiOauth;
  if (!oauth || !oauth.refreshToken) {
    logError(name, 'No claudeAiOauth.refreshToken found -- skipping');
    return { name, status: 'skipped', reason: 'no-refresh-token' };
  }

  if (!needsRefresh(oauth.expiresAt)) {
    const minutesLeft = Math.round((oauth.expiresAt - Date.now()) / 60000);
    log(name, `Token still valid (${minutesLeft} min remaining) -- skipping`);
    return { name, status: 'skipped', reason: 'still-valid', minutesLeft };
  }

  const minutesUntilExpiry = Math.round((oauth.expiresAt - Date.now()) / 60000);
  const expiryLabel = minutesUntilExpiry > 0
    ? `expires in ${minutesUntilExpiry} min`
    : `expired ${Math.abs(minutesUntilExpiry)} min ago`;

  log(name, `Token ${expiryLabel} -- refreshing...`);

  try {
    const tokenResponse = await requestTokenRefresh(oauth.refreshToken);

    const newExpiresAt = Date.now() + tokenResponse.expires_in * 1000;

    credentials.claudeAiOauth = {
      ...oauth,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: newExpiresAt,
    };

    writeCredentials(dir, credentials);

    const newMinutesLeft = Math.round((newExpiresAt - Date.now()) / 60000);
    log(name, `Refreshed successfully -- new token expires in ${newMinutesLeft} min`);
    return { name, status: 'refreshed', newExpiresAt };
  } catch (err) {
    logError(name, `Refresh failed: ${err.message}`);
    return { name, status: 'failed', error: err.message };
  }
}

async function main() {
  const profiles = discoverProfiles();

  if (profiles.length === 0) {
    console.log(`[${timestamp()}] No cc-auth-switcher profiles found (~/.claude-*). Nothing to refresh.`);
    return;
  }

  console.log(`[${timestamp()}] === Claude Code Token Refresh (${profiles.length} profile${profiles.length === 1 ? '' : 's'}) ===`);

  const results = [];
  for (const profile of profiles) {
    const result = await refreshProfile(profile);
    results.push(result);
  }

  const refreshed = results.filter(r => r.status === 'refreshed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  console.log(`[${timestamp()}] === Done: ${refreshed} refreshed, ${skipped} skipped, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
