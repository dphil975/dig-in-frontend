const frogPhilosophy = {
    title: "Why frogs?",
    message: `When you find an egg, you expect a bird.
Or a dragon. Or something that "makes sense."

But life doesn't work that way.

Every creature is a surprise.
Every personality is unique.
Every friendship is unexpected.

So yes. It's a frog.

And that's the best part.

— Dig In`,
    button: "🐸 I LOVE FROGS NOW 🐸"
};

const FAQ_ITEMS = [
    {
        icon: "🍳",
        q: "What is Dig In?",
        a: "Dig In turns what's already in your kitchen into a recipe. Scan your pantry, pick a match, and follow pixel-art flashcards step by step — no meal planning required."
    },
    {
        icon: "📷",
        q: "How does the pantry scanner work?",
        a: "Take a photo of your fridge or type ingredients manually. Dig In finds recipes where you already have 60%+ of what's needed, and suggests substitutions for the rest."
    },
    {
        icon: "🃏",
        q: "What are cooking flashcards?",
        a: "Each recipe step becomes a pixel-art card with a built-in timer. Tap through them one at a time so you always know exactly what to do next — no scrolling mid-cook."
    },
    {
        icon: "🎰",
        q: "What is the Recipe Rolodex?",
        a: "Spin the rolodex for random recipe discovery from cuisines around the world. Cook more recipes to unlock new countries on the world map."
    },
    {
        icon: "📍",
        q: "How do I find nearby stores?",
        a: "Allow location access and tap 'Find Stores Near Me'. Dig In uses OpenStreetMap to show grocery stores within walking distance — no account or API key needed."
    },
    {
        icon: "🔍",
        q: "What does the brand scanner do?",
        a: "Scan a barcode or search a brand name to see what changed in the ingredient list — and get a from-scratch recipe that skips the processed version entirely."
    },
    {
        icon: "💾",
        q: "How do I save recipes?",
        a: "Tap the save button on any recipe card. Saved recipes are stored locally. You can export them as a backup file from the save menu any time."
    },
    {
        icon: "📶",
        q: "Does Dig In work offline?",
        a: "The recipe carousel and any saved recipes work offline. The pantry scanner and store finder need a connection to reach the Dig In API."
    },
    {
        icon: "🐸",
        q: frogPhilosophy.title,
        a: frogPhilosophy.message,
        isFrog: true,
        frogButton: frogPhilosophy.button
    }
];

function showFrogPhilosophy() {
    const modal = document.createElement('div');
    modal.className = 'frog-philosophy-modal pixel-modal';
    modal.innerHTML = `
        <div class="modal-content frog-philosophy-content">
            <div class="frog-philosophy-icon">🐸❓</div>
            <h3>${frogPhilosophy.title}</h3>
            <p class="philosophy-text">${frogPhilosophy.message.replace(/\n/g, '<br>')}</p>
            <button class="pixel-button frog-love-btn">${frogPhilosophy.button}</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.frog-love-btn').addEventListener('click', () => modal.remove());
}

class OnboardingFAQ {
    constructor() {
        this.storageKey = 'digInOnboarded';
        this.injectStyles();
        this.addFAQTrigger();
        if (!localStorage.getItem(this.storageKey)) {
            this.show();
        }
    }

    injectStyles() {
        if (document.getElementById('faq-styles')) return;
        const style = document.createElement('style');
        style.id = 'faq-styles';
        style.textContent = `
            .faq-trigger-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 48px;
                height: 48px;
                background: var(--mama-brown, #8B5E3C);
                color: white;
                border: none;
                border-radius: 50%;
                font-family: 'Press Start 2P', monospace;
                font-size: 16px;
                cursor: pointer;
                z-index: 900;
                box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
                transition: transform 0.15s ease, background 0.15s ease;
            }
            .faq-trigger-btn:hover {
                background: var(--mama-red, #FF6B6B);
                transform: scale(1.1);
            }
            .faq-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1400;
                animation: fadeIn 0.2s ease;
            }
            .faq-modal {
                background: #FFF8F0;
                border: 6px solid #8B5E3C;
                border-radius: 20px;
                width: 92%;
                max-width: 560px;
                max-height: 88vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: bounceIn 0.35s ease;
            }
            .faq-modal-header {
                background: #FF6B6B;
                padding: 14px 18px;
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
            }
            .faq-modal-header h2 {
                flex: 1;
                margin: 0;
                font-family: 'Press Start 2P', monospace;
                font-size: 13px;
                color: white;
            }
            .faq-close-btn {
                background: none;
                border: none;
                font-size: 22px;
                cursor: pointer;
                color: white;
                line-height: 1;
            }
            .faq-welcome-banner {
                background: linear-gradient(135deg, #FFE66D, #FFB6C1);
                padding: 14px 18px;
                text-align: center;
                font-family: 'Press Start 2P', monospace;
                font-size: 9px;
                line-height: 1.7;
                color: #333;
                flex-shrink: 0;
            }
            .faq-list {
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                flex: 1;
            }
            .faq-item {
                border: 2px solid #E0E0E0;
                border-radius: 12px;
                overflow: hidden;
                background: white;
                transition: border-color 0.2s;
            }
            .faq-item:hover {
                border-color: #FF6B6B;
            }
            .faq-item.frog-item {
                border-color: #4CAF50;
            }
            .faq-question {
                width: 100%;
                background: none;
                border: none;
                padding: 12px 14px;
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                text-align: left;
                font-family: 'Press Start 2P', monospace;
                font-size: 9px;
                color: #333;
                transition: background 0.15s;
            }
            .faq-question:hover {
                background: #FFF0E0;
            }
            .faq-question[aria-expanded="true"] {
                background: #FFE4D6;
            }
            .faq-q-icon {
                font-size: 18px;
                flex-shrink: 0;
            }
            .faq-q-text {
                flex: 1;
                line-height: 1.5;
            }
            .faq-chevron {
                font-size: 10px;
                transition: transform 0.2s ease;
                flex-shrink: 0;
            }
            .faq-question[aria-expanded="true"] .faq-chevron {
                transform: rotate(180deg);
            }
            .faq-answer {
                display: none;
                padding: 0 14px 14px 42px;
                font-size: 11px;
                line-height: 1.7;
                color: #555;
                white-space: pre-line;
            }
            .faq-answer.open {
                display: block;
            }
            .faq-answer.frog-answer {
                font-style: italic;
                color: #2E7D32;
                background: #F1F8F1;
                padding: 12px 14px;
                margin: 0 10px 10px;
                border-radius: 10px;
                border-left: 3px solid #4CAF50;
            }
            .frog-love-btn-inline {
                display: block;
                margin: 12px auto 0;
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 16px;
                font-family: 'Press Start 2P', monospace;
                font-size: 8px;
                cursor: pointer;
                border-radius: 20px;
                transition: transform 0.15s, background 0.15s;
            }
            .frog-love-btn-inline:hover {
                background: #2E7D32;
                transform: scale(1.05);
            }
            .faq-footer {
                padding: 14px 18px;
                background: #FFF0E0;
                border-top: 2px solid #8B5E3C;
                display: flex;
                gap: 10px;
                flex-shrink: 0;
            }
            .faq-start-btn {
                flex: 1;
                background: #FF6B6B;
                color: white;
                border: none;
                padding: 12px;
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.15s, transform 0.1s;
            }
            .faq-start-btn:active {
                transform: scale(0.98);
            }
            .faq-start-btn:hover {
                background: #FF8E8E;
            }
            .frog-philosophy-modal {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1500;
            }
            .frog-philosophy-content {
                text-align: center;
                padding: 28px;
                max-width: 400px;
            }
            .frog-philosophy-icon {
                font-size: 48px;
                margin-bottom: 12px;
            }
            .philosophy-text {
                font-size: 13px;
                line-height: 1.8;
                color: #2E7D32;
                font-style: italic;
                white-space: pre-line;
                background: #F1F8F1;
                padding: 14px;
                border-radius: 10px;
                margin: 12px 0 18px;
            }
            @media (max-width: 480px) {
                .faq-modal { max-height: 94vh; }
                .faq-question { font-size: 8px; }
                .faq-answer { padding-left: 14px; }
            }
        `;
        document.head.appendChild(style);
    }

    addFAQTrigger() {
        const btn = document.createElement('button');
        btn.className = 'faq-trigger-btn';
        btn.setAttribute('aria-label', 'Help / FAQ');
        btn.textContent = '?';
        btn.addEventListener('click', () => this.show());
        document.body.appendChild(btn);
    }

    show() {
        const overlay = document.createElement('div');
        overlay.className = 'faq-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Dig In FAQ');

        overlay.innerHTML = `
            <div class="faq-modal">
                <div class="faq-modal-header">
                    <span>🍳</span>
                    <h2>HOW DOES DIG IN WORK?</h2>
                    <button class="faq-close-btn" aria-label="Close FAQ">✕</button>
                </div>
                <div class="faq-welcome-banner">
                    Welcome to Dig In!<br>
                    Pantry → Recipe → Plate. Let's go.
                </div>
                <div class="faq-list">
                    ${FAQ_ITEMS.map((item, i) => this.renderItem(item, i)).join('')}
                </div>
                <div class="faq-footer">
                    <button class="faq-start-btn">🍴 LET'S START COOKING</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
            overlay.remove();
            localStorage.setItem(this.storageKey, '1');
        };

        overlay.querySelector('.faq-close-btn').addEventListener('click', close);
        overlay.querySelector('.faq-start-btn').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        overlay.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', String(!expanded));
                btn.nextElementSibling.classList.toggle('open', !expanded);
            });
        });

        overlay.querySelectorAll('.frog-love-btn-inline').forEach(btn => {
            btn.addEventListener('click', () => {
                close();
                showFrogPhilosophy();
            });
        });
    }

    renderItem(item, index) {
        const answerClass = item.isFrog ? 'faq-answer frog-answer' : 'faq-answer';
        const itemClass = item.isFrog ? 'faq-item frog-item' : 'faq-item';
        const answerText = item.a.replace(/\n/g, '\n');
        const frogBtn = item.isFrog
            ? `<button class="frog-love-btn-inline">${item.frogButton}</button>`
            : '';

        return `
            <div class="${itemClass}">
                <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${index}">
                    <span class="faq-q-icon">${item.icon}</span>
                    <span class="faq-q-text">${item.q}</span>
                    <span class="faq-chevron">▼</span>
                </button>
                <div class="${answerClass}" id="faq-answer-${index}" role="region">
                    ${answerText}${frogBtn}
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OnboardingFAQ();
});
