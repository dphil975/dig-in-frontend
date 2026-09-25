/**
 * Dig In Main Application
 * Integrating all open source pixel art assets
 */

async function initDigIn() {
    try {
        const response = await fetch('licenses/attributions.json');
        const { attributions } = await response.json();
        renderAttributions(attributions);
    } catch (e) {
        // Attributions load is non-critical — app still runs without it
    }

    const button = document.createElement('button');
    button.textContent = 'START COOKING';
    button.className = 'pixel-button';
    button.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'pixel-modal';
        modal.innerHTML = `
            <div class="modal-content" style="padding: 28px; text-align: center;">
                <h3 style="font-family: 'Press Start 2P', monospace; font-size: 14px; margin-bottom: 16px;">
                    Welcome to Dig In
                </h3>
                <p style="font-size: 11px; line-height: 1.7; margin-bottom: 20px;">
                    Your kitchen adventure begins!
                </p>
                <div id="progressDemo" style="margin-bottom: 20px;"></div>
                <button class="pixel-button" id="startModalClose">LET'S COOK 🍳</button>
            </div>
        `;
        document.body.appendChild(modal);

        const progressContainer = modal.querySelector('#progressDemo');
        if (progressContainer) {
            const bar = document.createElement('div');
            bar.style.cssText = 'height:8px;background:#E0E0E0;border-radius:4px;overflow:hidden;';
            const fill = document.createElement('div');
            fill.style.cssText = 'height:100%;width:0%;background:#FF6B6B;transition:width 0.4s ease;';
            bar.appendChild(fill);
            progressContainer.appendChild(bar);

            let value = 0;
            const interval = setInterval(() => {
                value += 10;
                fill.style.width = `${value}%`;
                if (value >= 100) clearInterval(interval);
            }, 400);
        }

        modal.querySelector('#startModalClose').addEventListener('click', () => modal.remove());
    });

    document.body.appendChild(button);
}

function renderAttributions(attributions) {
    if (!attributions || !attributions.length) return;

    const footer = document.createElement('footer');
    footer.className = 'attributions-footer';
    footer.innerHTML = `
        <h4>Open Source Assets</h4>
        <ul>
            ${attributions.map(a => `
                <li>
                    <a href="${a.url}" target="_blank" rel="noopener noreferrer">${a.project}</a>
                    <span class="license-badge">${a.license}</span>
                    <span class="assets-used">${a.assets_used.join(', ')}</span>
                </li>
            `).join('')}
        </ul>
    `;
    document.body.appendChild(footer);
}

document.addEventListener('DOMContentLoaded', initDigIn);
