#!/bin/bash
# Dig In — Start all backends

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$HOME/Dig In-backend"

echo "🍳 Starting Dig In backends..."

# ── Node.js backend (port 5000) ───────────────────────────────────────────────
# Handles: recipes DB, file uploads, knowledge base, chemical reactions
if [ -d "$BACKEND_DIR" ]; then
    echo "▶ Node.js backend → http://localhost:5000"
    cd "$BACKEND_DIR"
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "  ⚠ Created .env from .env.example — update DB credentials if needed"
    fi
    npm start &
    NODE_PID=$!
else
    echo "⚠ Node backend not found at $BACKEND_DIR — skipping"
fi

# ── Python extraction service (port 5001) ────────────────────────────────────
# Handles: PDF/EPUB extraction, ML training, menu parsing
if [ -d "$BACKEND_DIR/python" ]; then
    echo "▶ Python service  → http://localhost:5001"
    cd "$BACKEND_DIR/python"
    python main.py &
    PYTHON_PID=$!
else
    echo "⚠ Python service not found — skipping"
fi

# ── Flask backend (port 5002) ─────────────────────────────────────────────────
# Handles: pantry scanning, ingredient substitutions, rolodex, shopping lists
FLASK_DIR="$ROOT/backend"
if [ -d "$FLASK_DIR" ]; then
    echo "▶ Flask backend   → http://localhost:5002"
    cd "$FLASK_DIR"
    python app.py &
    FLASK_PID=$!
else
    echo "⚠ Flask backend not found at $FLASK_DIR — skipping"
fi

cd "$ROOT"
echo ""
echo "✅ Backends started. Open index.html in your browser."
echo "   Node.js health: http://localhost:5000/health"
echo "   Python health:  http://localhost:5001/health"
echo "   Flask health:   http://localhost:5002/api/health"
echo ""
echo "Press Ctrl+C to stop all backends."

trap "echo ''; echo 'Stopping...'; kill $NODE_PID $PYTHON_PID $FLASK_PID 2>/dev/null; exit" INT TERM
wait
