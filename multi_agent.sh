#!/bin/bash

COMMAND1="node main.js agent2 slave"
COMMAND2="node main.js agent1 master"

# Controlla se tmux è disponibile
if command -v tmux &> /dev/null; then
    echo "Using tmux..."
    tmux new-session -d -s agents "$COMMAND1"
    sleep 1
    tmux split-window -h "$COMMAND2"
    tmux attach-session -t agents
    exit 0
fi

# Se tmux non è disponibile, prova con terminali separati
if command -v gnome-terminal &> /dev/null; then
    echo "Using gnome-terminal..."
    gnome-terminal -- bash -c "$COMMAND1; exec bash"
    sleep 1
    gnome-terminal -- bash -c "$COMMAND2; exec bash"
    exit 0
elif command -v x-terminal-emulator &> /dev/null; then
    echo "Using x-terminal-emulator..."
    x-terminal-emulator -e "bash -c '$COMMAND1; exec bash'" &
    sleep 1
    x-terminal-emulator -e "bash -c '$COMMAND2; exec bash'"
    exit 0
elif command -v konsole &> /dev/null; then
    echo "Using konsole..."
    konsole -e "bash -c '$COMMAND1; exec bash'" &
    sleep 1
    konsole -e "bash -c '$COMMAND2; exec bash'"
    exit 0
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Using macOS Terminal..."
    osascript -e "tell application \"Terminal\" to do script \"$COMMAND1\""
    sleep 1
    osascript -e "tell application \"Terminal\" to do script \"$COMMAND2\""
    exit 0
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    echo "Using Windows Terminal (cmd)..."
    start cmd /k "$COMMAND1"
    sleep 1
    start cmd /k "$COMMAND2"
    exit 0
else
    echo "Error: No compatible method found to execute agents. Use manual mode explained on GitHub."
    exit 1
fi