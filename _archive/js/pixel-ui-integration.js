/**
 * Pixel UI Component Integration
 * Using open source pixel UI libraries [citation:4][citation:9]
 */

class PixelUIIntegration {
    constructor() {
        this.components = {};
        this.init();
    }

    init() {
        this.createPixelButton();
        this.createPixelProgressBar();
        this.createPixelModal();
        this.createPixelTooltip();
    }

    createPixelButton() {
        // Using pixel styling from open source principles [citation:4]
        const style = document.createElement('style');
        style.textContent = `
            .pixel-btn {
                background: #FF6B6B;
                border: none;
                padding: 12px 24px;
                font-family: 'Press Start 2P', 'Courier New', monospace;
                font-size: 10px;
                color: white;
                text-shadow: 2px 2px 0 rgba(0,0,0,0.3);
                cursor: pointer;
                position: relative;
                box-shadow: inset -2px -2px 0 0 rgba(0,0,0,0.2), inset 2px 2px 0 0 rgba(255,255,255,0.3);
                transition: all 0.05s linear;
                image-rendering: crisp-edges;
                image-rendering: pixelated;
            }
            
            .pixel-btn:active {
                transform: translateY(2px);
                box-shadow: inset 2px 2px 0 0 rgba(0,0,0,0.2);
            }
            
            .pixel-progress {
                background: #DDD;
                border: 2px solid #000;
                height: 12px;
                position: relative;
                image-rendering: crisp-edges;
            }
            
            .pixel-progress-fill {
                background: #4CAF50;
                height: 100%;
                position: absolute;
                left: 0;
                top: 0;
                transition: width 0.1s step-end;
                image-rendering: crisp-edges;
            }
        `;
        document.head.appendChild(style);
    }

    createPixelProgressBar() {
        // Progress bar component from Phaser PixUI principles [citation:4]
        class PixelProgressBar {
            constructor(container, maxValue = 100, color = '#4CAF50') {
                this.container = container;
                this.maxValue = maxValue;
                this.currentValue = 0;
                this.color = color;
                this.element = null;
                this.render();
            }
            
            render() {
                this.element = document.createElement('div');
                this.element.className = 'pixel-progress';
                
                this.fillElement = document.createElement('div');
                this.fillElement.className = 'pixel-progress-fill';
                this.fillElement.style.backgroundColor = this.color;
                this.fillElement.style.width = '0%';
                
                this.element.appendChild(this.fillElement);
                this.container.appendChild(this.element);
            }
            
            setValue(value) {
                this.currentValue = Math.min(this.maxValue, Math.max(0, value));
                const percent = (this.currentValue / this.maxValue) * 100;
                this.fillElement.style.width = `${percent}%`;
            }
            
            increment(amount = 1) {
                this.setValue(this.currentValue + amount);
            }
        }
        
        this.components.ProgressBar = PixelProgressBar;
    }

    createPixelModal() {
        // Modal component from pixel UI patterns [citation:4]
        class PixelModal {
            constructor(title, content, options = {}) {
                this.title = title;
                this.content = content;
                this.options = options;
                this.element = null;
                this.render();
            }
            
            render() {
                this.element = document.createElement('div');
                this.element.className = 'pixel-modal';
                this.element.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                `;
                
                const modalBox = document.createElement('div');
                modalBox.style.cssText = `
                    background: #FFF8F0;
                    border: 6px solid #8B5E3C;
                    padding: 20px;
                    min-width: 300px;
                    max-width: 500px;
                    position: relative;
                `;
                
                // Corner decorations
                ['◤', '◥', '◣', '◢'].forEach((corner, i) => {
                    const cornerEl = document.createElement('div');
                    cornerEl.textContent = corner;
                    cornerEl.style.cssText = `
                        position: absolute;
                        font-size: 16px;
                        color: #8B5E3C;
                    `;
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
                titleEl.textContent = this.title;
                titleEl.style.cssText = `
                    font-family: 'Press Start 2P', monospace;
                    font-size: 12px;
                    margin-bottom: 16px;
                `;
                modalBox.appendChild(titleEl);
                
                const contentEl = document.createElement('div');
                contentEl.innerHTML = this.content;
                modalBox.appendChild(contentEl);
                
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'CLOSE';
                closeBtn.className = 'pixel-btn';
                closeBtn.style.marginTop = '16px';
                closeBtn.onclick = () => this.close();
                modalBox.appendChild(closeBtn);
                
                this.element.appendChild(modalBox);
                document.body.appendChild(this.element);
            }
            
            close() {
                if (this.element) {
                    this.element.remove();
                    if (this.options.onClose) this.options.onClose();
                }
            }
        }
        
        this.components.Modal = PixelModal;
    }

    createPixelTooltip() {
        // Tooltip helper for pixel UI
        class PixelTooltip {
            constructor(element, text) {
                this.element = element;
                this.text = text;
                this.tooltip = null;
                this.init();
            }
            
            init() {
                this.element.addEventListener('mouseenter', () => this.show());
                this.element.addEventListener('mouseleave', () => this.hide());
            }
            
            show() {
                this.tooltip = document.createElement('div');
                this.tooltip.textContent = this.text;
                this.tooltip.style.cssText = `
                    position: absolute;
                    background: #000;
                    color: #0F0;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 8px;
                    padding: 4px 8px;
                    border: 1px solid #0F0;
                    z-index: 1000;
                    white-space: nowrap;
                    image-rendering: crisp-edges;
                `;
                
                const rect = this.element.getBoundingClientRect();
                this.tooltip.style.top = `${rect.bottom + 5}px`;
                this.tooltip.style.left = `${rect.left}px`;
                
                document.body.appendChild(this.tooltip);
            }
            
            hide() {
                if (this.tooltip) {
                    this.tooltip.remove();
                    this.tooltip = null;
                }
            }
        }
        
        this.components.Tooltip = PixelTooltip;
    }

    getComponents() {
        return this.components;
    }
}