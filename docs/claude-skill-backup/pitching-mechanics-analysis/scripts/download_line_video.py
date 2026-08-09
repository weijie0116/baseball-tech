#!/usr/bin/env python3
"""
Download a video's raw content from LINE's Content API by message ID.
Reads LINE_CHANNEL_ACCESS_TOKEN from the Baseball_tech project's .env.local.

LINE only guarantees message content stays retrievable for a limited
window after it was sent — don't let requests sit pending too long before
running this.

Usage: python3 download_line_video.py <line_message_id> <output_path>
"""
import os
import sys
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


def main():
    if len(sys.argv) != 3:
        sys.exit("Usage: download_line_video.py <line_message_id> <output_path>")
    message_id, output_path = sys.argv[1], sys.argv[2]

    env = load_env(ENV_PATH)
    token = env["LINE_CHANNEL_ACCESS_TOKEN"]

    url = f"https://api-data.line.me/v2/bot/message/{message_id}/content"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Download failed ({e.code}): {e.read().decode(errors='replace')}")

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(data)

    print(f"Downloaded {len(data)} bytes -> {output_path}")


if __name__ == "__main__":
    main()
