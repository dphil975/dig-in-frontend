/**
 * Pixel UI Component Library
 * Authentic 2000s GBA/DS era interface elements
 */

class PixelUI {
    constructor() {
        this.pixelRenderer = new PixelArtRenderer();
        this.initPixelComponents();
    }

    initPixelComponents() {
        this.createPixelButton();
        this.createPixelProgressBar();
        this.createPixelModal();
    }

    createPixelButton(text, color = '#FF6B6B', onClick) {
        const button = document.createElement('button');
        button.className = 'pixel-button-2000s';
        button.textContent = text;
        button.style.background = color;
        button.style.border = 'none';
        button.style.position = 'relative';
        button.style.padding = '12px 24px';
        button.style.fontFamily = "'Press Start 2P', 'Courier New', monospace";
        button.style.fontSize = '10px';
        button.style.letterSpacing = '1px';
        button.style.cursor = 'pointer';
        
        // 2000s pixel button effect (3D press)
        button.style.boxShadow = `inset -2px -2px 0 0 rgba(0,0,0,0.2), inset 2px 2px 0 0 rgba(255,255,255,0.3)`;
        
        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(2px)';
            button.style.boxShadow = `inset 2px 2px 0 0 rgba(0,0,0,0.2)`;
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = `inset -2px -2px 0 0 rgba(0,0,0,0.2), inset 2px 2px 0 0 rgba(255,255,255,0.3)`;
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
        
        if (onClick) button.addEventListener('click', onClick);
        
        return button;
    }

    createPixelProgressBar(value, max, color = '#4CAF50') {
        const container = document.createElement('div');
        container.className = 'pixel-progress-container';
        container.style.width = '100%';
        container.style.height = '12px';
        container.style.background = '#DDD';
        container.style.border = '2px solid #000';
        container.style.position = 'relative';
        
        const fill = document.createElement('div');
        fill.className = 'pixel-progress-fill';
        fill.style.width = `${(value / max) * 100}%`;
        fill.style.height = '100%';
        fill.style.background = color;
        
        // Pixelated progress (blocky, not smooth)
        fill.style.position = 'absolute';
        fill.style.left = '0';
        fill.style.top = '0';
        
        container.appendChild(fill);
        
        return container;
    }

    createPixelModal(title, content, onClose) {
        const modal = document.createElement('div');
        modal.className = 'pixel-modal-2000s';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.background = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '2000';
        
        const modalBox = document.createElement('div');
        modalBox.style.background = '#FFF8F0';
        modalBox.style.border = '6px solid #8B5E3C';
        modalBox.style.borderRadius = '0'; // Square corners = pixel perfect
        modalBox.style.padding = '20px';
        modalBox.style.minWidth = '300px';
        modalBox.style.maxWidth = '500px';
        modalBox.style.position = 'relative';
        
        // Pixel corner decorations
        const corners = ['◤', '◥', '◣', '◢'];
        corners.forEach((corner, i) => {
            const cornerEl = document.createElement('div');
            cornerEl.textContent = corner;
            cornerEl.style.position = 'absolute';
            cornerEl.style.fontSize = '16px';
            cornerEl.style.color = '#8B5E3C';
            const positions = [
                { top: '-8px', left: '-8px' },
                { top: '-8px', right: '-8px' },
                { bottom: '-8px', left: '-8px' },
                { bottom: '-8px', right: '-8px' }
            ];
            Object.assign(cornerEl.style, positions[i]);
            modalBox.appendChild(cornerEl);
        });
        
        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.fontFamily = "'Press Start 2P', monospace";
        titleEl.style.fontSize = '12px';
        titleEl.style.marginBottom = '16px';
        modalBox.appendChild(titleEl);
        
        const contentEl = document.createElement('div');
        contentEl.innerHTML = content;
        modalBox.appendChild(contentEl);
        
        const closeBtn = this.createPixelButton('CLOSE', '#666', () => {
            modal.remove();
            if (onClose) onClose();
        });
        closeBtn.style.marginTop = '16px';
        modalBox.appendChild(closeBtn);
        
        modal.appendChild(modalBox);
        document.body.appendChild(modal);
        
        return modal;
    }
}