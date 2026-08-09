#!/bin/bash
# Extract candidate still frames from a pitching video at fine intervals,
# for visual review when picking checkpoint frames.
#
# Usage: extract_candidates.sh <video_path> <start_seconds> <duration_seconds> <output_dir> [interval_seconds]
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

VIDEO="$1"
START="$2"
DURATION="$3"
OUTDIR="$4"
INTERVAL="${5:-0.12}"

if [ -z "$VIDEO" ] || [ -z "$START" ] || [ -z "$DURATION" ] || [ -z "$OUTDIR" ]; then
  echo "Usage: $0 <video_path> <start_seconds> <duration_seconds> <output_dir> [interval_seconds]" >&2
  exit 1
fi

mkdir -p "$OUTDIR"

fps=$(echo "scale=4; 1 / $INTERVAL" | bc)

ffmpeg -y -ss "$START" -i "$VIDEO" -t "$DURATION" \
  -vf "fps=$fps,scale=720:-1:flags=lanczos" \
  "$OUTDIR/frame_%03d.png" -loglevel error

count=$(ls "$OUTDIR"/frame_*.png 2>/dev/null | wc -l | tr -d ' ')
echo "Extracted $count candidate frames to $OUTDIR (interval ${INTERVAL}s, window ${START}s-+${DURATION}s)"

# Print each frame's approximate source timestamp for reference when picking.
i=0
for f in "$OUTDIR"/frame_*.png; do
  t=$(echo "$START + $i * $INTERVAL" | bc)
  echo "  $(basename "$f")  ~${t}s"
  i=$((i + 1))
done
