#!/usr/bin/env python3
"""
List pending video requests submitted via the LINE bot (coach sent a
student's name, then a video, in the LINE chat). Reads Supabase URL/key
from the Baseball_tech project's .env.local.

Usage: python3 list_pending_line_requests.py
"""
import json
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
    env = load_env(ENV_PATH)
    supabase_url = env["NEXT_PUBLIC_SUPABASE_URL"]
    service_key = env["SUPABASE_SERVICE_ROLE_KEY"]

    url = (
        f"{supabase_url}/rest/v1/line_video_requests"
        "?status=eq.pending&select=id,line_message_id,student_id,student_name_hint,created_at"
        "&order=created_at.asc"
    )
    req = urllib.request.Request(url, headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"})
    with urllib.request.urlopen(req) as resp:
        rows = json.loads(resp.read())

    if not rows:
        print("No pending LINE video requests.")
        return

    for r in rows:
        print(f"{r['id']}  student={r['student_name_hint']} ({r['student_id']})  "
              f"line_message_id={r['line_message_id']}  requested={r['created_at']}")


if __name__ == "__main__":
    main()
