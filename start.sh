#!/bin/bash
# Dig In — Start all services (backends + frontend)

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$HOME/Dig In-backend"

echo "Starting Dig In..."

# ── Node.js backend (port 5000) ───────────────────────────────────────────────
# Handles: recipes DB, file uploads, knowledge base, chemical reactions
if [ -d "$BACKEND_DIR" ]; then
    echo "  Node.js backend → http://localhost:5000"
    cd "$BACKEND_DIR"
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "  Created .env from .env.example — update DB credentials if needed"
    fi
    npm start &
    NODE_PID=$!
else
    echo "  Node backend not found at $BACKEND_DIR — skipping"
    NODE_PID=""
fi

# ── Python extraction service (port 5001) ────────────────────────────────────
# Handles: PDF/EPUB extraction, ML training, menu parsing
if [ -d "$BACKEND_DIR/python" ]; then
    echo "  Python service  → http://localhost:5001"
    cd "$BACKEND_DIR/python"
    python main.py &
    PYTHON_PID=$!
else
    echo "  Python service not found — skipping"
    PYTHON_PID=""
fi

# ── Flask backend (port 5002) ─────────────────────────────────────────────────
# Handles: pantry scanning, ingredient substitutions, rolodex, shopping lists
FLASK_DIR="$ROOT/backend"
if [ -d "$FLASK_DIR" ]; then
    echo "  Flask backend   → http://localhost:5002"
    cd "$FLASK_DIR"
    python app.py &
    FLASK_PID=$!
else
    echo "  Flask backend not found at $FLASK_DIR — skipping"
    FLASK_PID=""
fi

# ── AI API server (port 5003) ─────────────────────────────────────────────────
# Local runner for the Vercel /api/recipe-ai function.
# Reads OPENAI_API_KEY from .env — set it there to enable AI recipes.
cd "$ROOT"
if [ -f ".env" ] && grep -q "OPENAI_API_KEY=." ".env" 2>/dev/null; then
    echo "  AI API server   → http://localhost:5003"
    node --env-file=.env api-server.js &
    AI_PID=$!
else
    echo "  AI API server   → skipped (OPENAI_API_KEY not set in .env)"
    AI_PID=""
fi

# ── Vite frontend (port 5173) ─────────────────────────────────────────────────
cd "$ROOT"
echo "  Frontend (Vite) → http://localhost:5173"
npm run dev -- --port 5173 &
VITE_PID=$!

echo ""
echo "All services started."
echo "  App:          http://localhost:5173"
echo "  Node health:  http://localhost:5000/health"
echo "  Python health: http://localhost:5001/health"
echo "  Flask health: http://localhost:5002/api/health"
echo ""
echo "Press Ctrl+C to stop everything."

trap "echo ''; echo 'Stopping...'; kill $NODE_PID $PYTHON_PID $FLASK_PID $AI_PID $VITE_PID 2>/dev/null; exit" INT TERM
wait
