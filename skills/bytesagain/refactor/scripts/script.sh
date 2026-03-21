#!/usr/bin/env bash
set -euo pipefail

# refactor — skill script
# Powered by BytesAgain | bytesagain.com | hello@bytesagain.com

DATA_DIR="${HOME}/.refactor"
mkdir -p "$DATA_DIR"

show_help() {
    cat << 'HELPEOF'
refactor — command-line tool

Commands:
  analyze        Run analyze operation
  rename         Run rename operation
  extract        Run extract operation
  inline         Run inline operation
  move           Run move operation
  dead-code      Run dead-code operation
  complexity     Run complexity operation
  report         Run report operation
  config         Run config operation
  export         Run export operation
  stats      Show statistics
  export     Export data (json|csv|txt)
  search     Search across entries
  recent     Show recent entries
  status     Show current status
  help       Show this help message
  version    Show version number

Data stored in: ~/.refactor/
HELPEOF
}

show_version() {
    echo "refactor v1.0.0 — Powered by BytesAgain"
}

cmd_stats() {
    echo "=== refactor Statistics ==="
    local total=0
    for f in "$DATA_DIR"/*.log; do
        [ -f "$f" ] || continue
        local name=$(basename "$f" .log)
        local c=$(wc -l < "$f" 2>/dev/null || echo 0)
        total=$((total + c))
        echo "  $name: $c entries"
    done
    echo "  Total: $total entries"
    echo "  Data size: $(du -sh "$DATA_DIR" 2>/dev/null | cut -f1 || echo 'N/A')"
    echo "  Since: $(head -1 "$DATA_DIR/history.log" 2>/dev/null | cut -d'|' -f1 || echo 'N/A')"
}

cmd_export() {
    local fmt="${1:-json}"
    local out="refactor-export.$fmt"
    case "$fmt" in
        json)
            echo "[" > "$out"
            local first=1
            for f in "$DATA_DIR"/*.log; do
                [ -f "$f" ] || continue
                while IFS= read -r line; do
                    [ $first -eq 1 ] && first=0 || echo "," >> "$out"
                    local ts=$(echo "$line" | cut -d'|' -f1)
                    local cmd=$(echo "$line" | cut -d'|' -f2)
                    local data=$(echo "$line" | cut -d'|' -f3-)
                    printf '  {"timestamp":"%s","command":"%s","data":"%s"}' "$ts" "$cmd" "$data" >> "$out"
                done < "$f"
            done
            echo "" >> "$out"
            echo "]" >> "$out"
            ;;
        csv)
            echo "timestamp,command,data" > "$out"
            for f in "$DATA_DIR"/*.log; do
                [ -f "$f" ] || continue
                while IFS= read -r line; do
                    echo "$line" | awk -F'|' '{printf "\"%s\",\"%s\",\"%s\"\n", $1, $2, $3}' >> "$out"
                done < "$f"
            done
            ;;
        txt)
            > "$out"
            for f in "$DATA_DIR"/*.log; do
                [ -f "$f" ] || continue
                echo "--- $(basename "$f" .log) ---" >> "$out"
                cat "$f" >> "$out"
                echo "" >> "$out"
            done
            ;;
        *)
            echo "Unknown format: $fmt (use json, csv, or txt)"
            return 1
            ;;
    esac
    echo "Exported to $out ($(wc -c < "$out" 2>/dev/null || echo 0) bytes)"
}

cmd_search() {
    local term="${1:-}"
    [ -z "$term" ] && { echo "Usage: refactor search <term>"; return 1; }
    echo "=== Search: $term ==="
    local found=0
    for f in "$DATA_DIR"/*.log; do
        [ -f "$f" ] || continue
        local matches=$(grep -i "$term" "$f" 2>/dev/null || true)
        if [ -n "$matches" ]; then
            echo "--- $(basename "$f" .log) ---"
            echo "$matches"
            found=$((found + 1))
        fi
    done
    [ $found -eq 0 ] && echo "No matches found."
}

cmd_recent() {
    local n="${1:-10}"
    echo "=== Recent $n entries ==="
    for f in "$DATA_DIR"/*.log; do
        [ -f "$f" ] || continue
        tail -n "$n" "$f" 2>/dev/null
    done | sort -t'|' -k1 | tail -n "$n"
}

cmd_status() {
    echo "=== refactor Status ==="
    echo "  Entries: $(cat "$DATA_DIR"/*.log 2>/dev/null | wc -l || echo 0)"
    echo "  Disk: $(du -sh "$DATA_DIR" 2>/dev/null | cut -f1 || echo 'N/A')"
    local last=$(tail -1 "$DATA_DIR/history.log" 2>/dev/null || echo "never")
    echo "  Last activity: $last"
}

# Main
CMD="${1:-help}"
shift 2>/dev/null || true

case "$CMD" in
    analyze)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|analyze|${*}" >> "$DATA_DIR/analyze.log"
        local total=$(wc -l < "$DATA_DIR/analyze.log" 2>/dev/null || echo 0)
        echo "[refactor] analyze recorded (entry #$total)"
        ;;
    rename)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|rename|${*}" >> "$DATA_DIR/rename.log"
        local total=$(wc -l < "$DATA_DIR/rename.log" 2>/dev/null || echo 0)
        echo "[refactor] rename recorded (entry #$total)"
        ;;
    extract)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|extract|${*}" >> "$DATA_DIR/extract.log"
        local total=$(wc -l < "$DATA_DIR/extract.log" 2>/dev/null || echo 0)
        echo "[refactor] extract recorded (entry #$total)"
        ;;
    inline)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|inline|${*}" >> "$DATA_DIR/inline.log"
        local total=$(wc -l < "$DATA_DIR/inline.log" 2>/dev/null || echo 0)
        echo "[refactor] inline recorded (entry #$total)"
        ;;
    move)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|move|${*}" >> "$DATA_DIR/move.log"
        local total=$(wc -l < "$DATA_DIR/move.log" 2>/dev/null || echo 0)
        echo "[refactor] move recorded (entry #$total)"
        ;;
    dead-code)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|dead-code|${*}" >> "$DATA_DIR/dead-code.log"
        local total=$(wc -l < "$DATA_DIR/dead-code.log" 2>/dev/null || echo 0)
        echo "[refactor] dead-code recorded (entry #$total)"
        ;;
    complexity)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|complexity|${*}" >> "$DATA_DIR/complexity.log"
        local total=$(wc -l < "$DATA_DIR/complexity.log" 2>/dev/null || echo 0)
        echo "[refactor] complexity recorded (entry #$total)"
        ;;
    report)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|report|${*}" >> "$DATA_DIR/report.log"
        local total=$(wc -l < "$DATA_DIR/report.log" 2>/dev/null || echo 0)
        echo "[refactor] report recorded (entry #$total)"
        ;;
    config)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|config|${*}" >> "$DATA_DIR/config.log"
        local total=$(wc -l < "$DATA_DIR/config.log" 2>/dev/null || echo 0)
        echo "[refactor] config recorded (entry #$total)"
        ;;
    export)
        local ts=$(date '+%Y-%m-%d %H:%M')
        echo "$ts|export|${*}" >> "$DATA_DIR/export.log"
        local total=$(wc -l < "$DATA_DIR/export.log" 2>/dev/null || echo 0)
        echo "[refactor] export recorded (entry #$total)"
        ;;
    stats)
        cmd_stats
        ;;
    export)
        cmd_export "$@"
        ;;
    search)
        cmd_search "$@"
        ;;
    recent)
        cmd_recent "$@"
        ;;
    status)
        cmd_status
        ;;
    help|--help|-h)
        show_help
        ;;
    version|--version|-v)
        show_version
        ;;
    *)
        echo "Unknown command: $CMD"
        echo "Run 'refactor help' for usage."
        exit 1
        ;;
esac
