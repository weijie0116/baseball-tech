#!/usr/bin/env python3
"""
Mark a LINE video request as done (or errored) and optionally push a LINE
message back to the sender confirming it.

Usage:
  python3 finish_line_request.py --request-id <uuid> --session-id <uuid> \
    [--status done|error] [--error "message"] [--push-line-user-id <id> --push-text "..."]
"""
import argparse
import json
import os
import urllib.request

ENV_PATH = os.path.expanduser("~/Projects/Baseball_tech/.env.local")


def load_env(path):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    return env


def request(method, url, headers, body=None):
    data = json.dumps(body).encode() if isinstance(body, (dict, list)) else body
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return resp.status, resp.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--request-id", required=True)
    ap.add_argument("--session-id")
    ap.add_argument("--status", default="done", choices=["done", "error"])
    ap.add_argument("--error")
    ap.add_argument("--push-line-user-id")
    ap.add_argument("--push-text")
    args = ap.parse_args()

    env = load_env(ENV_PATH)
    supabase_url = env["NEXT_PUBLIC_SUPABASE_URL"]
    service_key = env["SUPABASE_SERVICE_ROLE_KEY"]

    from datetime import datetime, timezone
    patch_body = {
        "status": args.status,
        "processed_at": datetime.now(timezone.utc).isoformat(),
    }
    if args.session_id:
        patch_body["training_session_id"] = args.session_id
    if args.error:
        patch_body["error_message"] = args.error

    url = f"{supabase_url}/rest/v1/line_video_requests?id=eq.{args.request_id}"
    status, resp = request(
        "PATCH", url,
        {"apikey": service_key, "Authorization": f"Bearer {service_key}",
         "Content-Type": "application/json", "Prefer": "return=minimal"},
        patch_body,
    )
    if status >= 300:
        raise SystemExit(f"Failed to update request ({status}): {resp.decode(errors='replace')}")
    print(f"Marked {args.request_id} as {args.status}")

    if args.push_line_user_id and args.push_text:
        token = env["LINE_CHANNEL_ACCESS_TOKEN"]
        status, resp = request(
            "POST", "https://api.line.me/v2/bot/message/push",
            {"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            {"to": args.push_line_user_id, "messages": [{"type": "text", "text": args.push_text}]},
        )
        if status >= 300:
            print(f"[warn] push message failed ({status}): {resp.decode(errors='replace')}")
        else:
            print("Push notification sent.")


if __name__ == "__main__":
    main()
