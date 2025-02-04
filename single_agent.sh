#!/bin/bash

COMMAND="node main.js agent1"

# Controlla se tmux è disponibile
if command -v tmux &> /dev/null; then
    echo "Using tmux..."
    tmux new-session -d -s agent_session "$COMMAND"
    tmux attach-session -t agent_session
    exit 0
fi

# Se tmux non è disponibile, prova con terminali separati
if command -v gnome-terminal &> /dev/null; then
    echo "Using gnome-terminal..."
    gnome-terminal -- bash -c "$COMMAND; exec bash"
    exit 0
elif command -v x-terminal-emulator &> /dev/null; then
    echo "Using x-terminal-emulator..."
    x-terminal-emulator -e "bash -c '$COMMAND; exec bash'"
    exit 0
elif command -v konsole &> /dev/null; then
    echo "Using konsole..."
    konsole -e "bash -c '$COMMAND; exec bash'"
    exit 0
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Using macOS Terminal..."
    osascript -e "tell application \"Terminal\" to do script \"$COMMAND\""
    exit 0
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    echo "Using Windows Terminal (cmd)..."
    start cmd /k "$COMMAND"
    exit 0
else
    echo "Error: No compatible method found to execute agents. Use manual mode explained on GitHub."
    exit 1
fi
