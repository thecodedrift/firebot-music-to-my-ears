/**
 * One-time Spotify OAuth helper for the test harness.
 *
 * Runs the Authorization Code flow against a throwaway localhost callback,
 * exchanges the returned code for tokens, and writes SPOTIFY_REFRESH_TOKEN into
 * `.env` so the live Jest search tests (`pnpm test`) can mint access tokens.
 *
 * By default this reuses Firebot's own redirect URI
 * (http://127.0.0.1:7472/api/v1/auth/callback), which is already registered in
 * your Spotify app — so no dashboard change is needed. The catch: that port
 * belongs to Firebot, so CLOSE FIREBOT before running this. Override with
 * SPOTIFY_REDIRECT_URI in .env if you'd rather register a different one.
 */
import "dotenv/config";

import { exec } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  SPOTIFY_AUTH_HOST,
  SPOTIFY_AUTHORIZE_PATH,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_URL,
} from "../../src/shared/constants";
import type { SpotifyRefreshTokenResponse } from "../../src/types/spotify";
import { readEnv } from "./firebotStub";

// Default to Firebot's already-registered redirect URI so no Spotify dashboard
// change is needed (requires Firebot to be closed, as it owns this port).
const REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:7472/api/v1/auth/callback";
const redirectUrl = new URL(REDIRECT_URI);
const PORT = Number(redirectUrl.port || "80");
const CALLBACK_PATH = redirectUrl.pathname;
const ENV_PATH = resolve(process.cwd(), ".env");

/** Pseudo-random CSRF state (harness-only; not security-critical). */
function makeState(): string {
  return `mtme-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

/** Best-effort cross-platform "open this URL in a browser". */
function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd =
    platform === "darwin" ? "open" : platform === "win32" ? "start \"\"" : "xdg-open";
  exec(`${cmd} "${url}"`, (err) => {
    if (err) {
      // Non-fatal: the URL is also printed for manual opening.
    }
  });
}

/** Upsert a single KEY=value line in .env, preserving everything else. */
function writeEnvVar(key: string, value: string): void {
  let contents = "";
  try {
    contents = readFileSync(ENV_PATH, "utf8");
  } catch {
    // No .env yet; we'll create one.
  }

  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(contents)) {
    contents = contents.replace(pattern, line);
  } else {
    if (contents.length > 0 && !contents.endsWith("\n")) contents += "\n";
    contents += `${line}\n`;
  }
  writeFileSync(ENV_PATH, contents, "utf8");
}

async function exchangeCodeForTokens(code: string, clientId: string, clientSecret: string) {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token exchange failed (status ${response.status}): ${body}`);
  }
  return (await response.json()) as SpotifyRefreshTokenResponse;
}

function buildAuthorizeUrl(clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    state,
  });
  return `${SPOTIFY_AUTH_HOST}${SPOTIFY_AUTHORIZE_PATH}?${params.toString()}`;
}

function html(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:system-ui;max-width:32rem;margin:4rem auto;line-height:1.5"><h1>${title}</h1><p>${body}</p></body></html>`;
}

async function main(): Promise<void> {
  // Refresh token not required for the auth step — we're about to create it.
  const { clientId, clientSecret } = readEnv(false);
  const state = makeState();

  await new Promise<void>((resolveDone, rejectDone) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404).end("Not found");
        return;
      }

      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");

      const finish = (statusCode: number, page: string, done: () => void) => {
        res.writeHead(statusCode, { "Content-Type": "text/html" }).end(page);
        server.close();
        done();
      };

      if (error) {
        finish(400, html("Authorization failed", `Spotify returned: ${error}`), () =>
          rejectDone(new Error(`Spotify authorization error: ${error}`))
        );
        return;
      }
      if (returnedState !== state) {
        finish(400, html("Authorization failed", "State mismatch — please retry."), () =>
          rejectDone(new Error("OAuth state mismatch"))
        );
        return;
      }
      if (!code) {
        finish(400, html("Authorization failed", "No code returned."), () =>
          rejectDone(new Error("No authorization code returned"))
        );
        return;
      }

      exchangeCodeForTokens(code, clientId, clientSecret)
        .then((tokens) => {
          if (!tokens.refresh_token) {
            throw new Error("Spotify did not return a refresh_token");
          }
          writeEnvVar("SPOTIFY_REFRESH_TOKEN", tokens.refresh_token);
          finish(
            200,
            html("Linked!", "Refresh token saved to <code>.env</code>. You can close this tab and return to the terminal."),
            resolveDone
          );
          console.log("\n✓ Refresh token written to .env");
          console.log("  Now run the live search tests:  pnpm test");
        })
        .catch((err) => {
          finish(500, html("Token exchange failed", String(err)), () => rejectDone(err));
        });
    });

    server.listen(PORT, "127.0.0.1", () => {
      const authorizeUrl = buildAuthorizeUrl(clientId, state);
      console.log("Spotify OAuth harness");
      console.log("─".repeat(48));
      console.log(`Redirect URI (must be registered in your Spotify app):\n  ${REDIRECT_URI}\n`);
      console.log("Opening your browser to authorize. If it doesn't open, visit:\n");
      console.log(`  ${authorizeUrl}\n`);
      console.log("Waiting for the callback…");
      openBrowser(authorizeUrl);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        rejectDone(
          new Error(
            `Port ${PORT} is in use — close Firebot (it owns this port) and try again, ` +
              `or set SPOTIFY_REDIRECT_URI to a different registered redirect.`
          )
        );
        return;
      }
      rejectDone(err);
    });
  });
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
