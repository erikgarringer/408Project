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
  printf "  ${BOLD}%s${RESET}  - %s\n" "$cmd" "$desc"
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

# Print a blank line
print_blank() {
  echo ""
}

# Initialize colors on sourcing
setup_colors
