#!/usr/bin/env bash
# Fancy output utilities for dev.sh
# Provides color definitions and structured output helpers

# Detect if terminal supports color
setup_colors() {
  TERM_SUPPORTS_COLOR=0
  if [ -t 1 ]; then
    TERM_SUPPORTS_COLOR=1
  fi

  RESET=""
  BOLD=""
  CYAN=""
  GREEN=""
  MAGENTA=""

  if [ "$TERM_SUPPORTS_COLOR" -eq 1 ]; then
    RESET="\033[0m"
    BOLD="\033[1m"
    CYAN="\033[36m"
    GREEN="\033[32m"
    MAGENTA="\033[35m"
  fi
}

# Print a box with title centered inside
print_fancy_box() {
  local title="$1"
  local box_width="${2:-70}"

  local title_len=$(printf "%s" "$title" | wc -m | tr -d ' ')
  local left_pad=$(( (box_width - title_len) / 2 ))
  local right_pad=$(( box_width - title_len - left_pad ))

  printf "%b" "${BOLD}${CYAN}┌$(printf '%.0s─' $(seq 1 $box_width))┐${RESET}\n"
  printf "%b" "${BOLD}${CYAN}│$(printf '%*s' $left_pad)${GREEN}${title}${CYAN}$(printf '%*s' "$right_pad")│${RESET}\n"
  printf "%b" "${BOLD}${CYAN}└$(printf '%.0s─' $(seq 1 $box_width))┘${RESET}\n"
}

# Print a section header
print_section() {
  local section="$1"
  printf "%b" "${MAGENTA}${section}:${RESET}\n"
}

# Print a command entry with description (single column)
print_command() {
  local cmd="$1"
  local desc="$2"
  # Pad command label so all hyphens align
  printf "  ${BOLD}%-18s${RESET} - %s\n" "$cmd" "$desc"
}

# Print commands in two columns (just commands, no descriptions)
print_commands_columns() {
  local -a commands=("$@")
  local col1_width=25
  local i=0
  local line=""

  for cmd in "${commands[@]}"; do
    if [ $((i % 2)) -eq 0 ]; then
      # Start of a new line
      line="  ${BOLD}$(printf '%-'$col1_width's' "$cmd")${RESET}"
    else
      # Second column
      printf "%b  %b%s${RESET}\n" "$line" "${BOLD}" "$cmd"
      line=""
    fi
    ((i++))
  done

  # Print any remaining odd item
  if [ $((i % 2)) -ne 0 ]; then
    printf "%b\n" "$line"
  fi
}

# Print commands in a single column (no descriptions)
print_commands_list() {
  local -a commands=("$@")
  for cmd in "${commands[@]}"; do
    printf "  ${BOLD}%s${RESET}\n" "$cmd"
  done
}

# Print command descriptions in two aligned columns (cmd/desc pairs)
print_command_desc_columns() {
  local -a items=("$@")

  # Determine max command label width (character count, not bytes)
  local max_cmd_len=0
  local idx=0
  while [ $idx -lt ${#items[@]} ]; do
    local cmd="${items[$idx]}"
    local cmd_len
    cmd_len=$(printf "%s" "$cmd" | wc -m | tr -d ' ')
    if [ "$cmd_len" -gt "$max_cmd_len" ]; then
      max_cmd_len=$cmd_len
    fi
    idx=$((idx+2))
  done

  # Add a little padding so the hyphen lines up nicely
  local col_width=$((max_cmd_len + 2))
  local desc_width=60

  idx=0
  while [ $idx -lt ${#items[@]} ]; do
    local cmd1="${items[$idx]}"
    local desc1="${items[$((idx+1))]:-}"
    local cmd2="${items[$((idx+2))]:-}"
    local desc2="${items[$((idx+3))]:-}"

    if [ -n "$cmd2" ]; then
      printf "  ${BOLD}%-*s${RESET} - %-*.*s  ${BOLD}%-*s${RESET} - %s\n" \
        "$col_width" "$cmd1" "$desc_width" "$desc_width" "$desc1" \
        "$col_width" "$cmd2" "$desc2"
      idx=$((idx+4))
    else
      printf "  ${BOLD}%-*s${RESET} - %s\n" "$col_width" "$cmd1" "$desc1"
      idx=$((idx+2))
    fi
  done
}

# Print a blank line
print_blank() {
  echo ""
}

# Initialize colors on sourcing
setup_colors
