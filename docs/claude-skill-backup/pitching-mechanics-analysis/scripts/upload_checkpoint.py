#!/usr/bin/env python3
"""
Upload chosen pitching-mechanics checkpoint frames to Supabase Storage and
record them in session_checkpoint_frames, marking the parent training
session as a checkpoint.

Reads Supabase URL/service-role key from the Baseball_tech project's
.env.local (stdlib only, no extra dependencies).

Usage:
  python3 upload_checkpoint.py --session-id <uuid> \
    --frame "<path>:<timestamp_seconds>:<phase_label>" \
    --frame "<path>:<timestamp_seconds>:<phase_label>" \
    ...
"""
import argparse
import json
import mimetypes
import os
import re
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


def request(method, url, headers, body=None):
    data = json.dumps(body).encode() if isinstance(body, (dict, list)) else body
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--session-id", required=True)
    ap.add_argument("--frame", action="append", required=True,
                     help="local_path:timestamp_seconds:phase_label")
    args = ap.parse_args()

    if not os.path.exists(ENV_PATH):
        sys.exit(f"Can't find {ENV_PATH} — run this from a machine with the project checked out")

    env = load_env(ENV_PATH)
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        sys.exit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

    session_id = args.session_id
    auth_headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }

    for order, frame_arg in enumerate(args.frame, start=1):
        parts = frame_arg.split(":", 2)
        if len(parts) != 3:
            sys.exit(f"Bad --frame value (want path:timestamp:phase_label): {frame_arg}")
        local_path, timestamp, phase_label = parts
        if not os.path.exists(local_path):
            sys.exit(f"File not found: {local_path}")

        ext = os.path.splitext(local_path)[1] or ".png"
        storage_key = f"{session_id}/{order}{ext}"
        content_type = mimetypes.guess_type(local_path)[0] or "image/png"

        with open(local_path, "rb") as f:
            file_bytes = f.read()

        upload_url = f"{supabase_url}/storage/v1/object/checkpoint-frames/{storage_key}"
        status, resp = request(
            "POST", upload_url,
            {**auth_headers, "Content-Type": content_type, "x-upsert": "true"},
            file_bytes,
        )
        if status >= 300:
            sys.exit(f"Upload failed for {local_path} ({status}): {resp.decode(errors='replace')}")
        print(f"[{order}] uploaded {local_path} -> {storage_key}")

        row = {
            "session_id": session_id,
            "frame_order": order,
            "video_timestamp_seconds": float(timestamp),
            "image_storage_key": storage_key,
            "phase_guess": phase_label,
            "is_ai_suggested": True,
            "confirmed_by_coach": False,
        }
        insert_url = f"{supabase_url}/rest/v1/session_checkpoint_frames"
        status, resp = request(
            "POST", insert_url,
            {**auth_headers, "Content-Type": "application/json", "Prefer": "return=minimal"},
            row,
        )
        if status >= 300:
            sys.exit(f"DB insert failed for frame {order} ({status}): {resp.decode(errors='replace')}")
        print(f"[{order}] recorded in session_checkpoint_frames (t={timestamp}s, phase={phase_label})")

    patch_url = f"{supabase_url}/rest/v1/training_sessions?id=eq.{session_id}"
    status, resp = request(
        "PATCH", patch_url,
        {**auth_headers, "Content-Type": "application/json", "Prefer": "return=minimal"},
        {"is_checkpoint": True},
    )
    if status >= 300:
        sys.exit(f"Failed to mark session as checkpoint ({status}): {resp.decode(errors='replace')}")

    print(f"\nDone. Session {session_id} marked as checkpoint with {len(args.frame)} frame(s).")
    print("Coach can now fill in phase label / analysis text on the session's website page.")


if __name__ == "__main__":
    main()
