/**
 * Dig In Receipt Scanner
 * Uses Tesseract.js for OCR (runs locally, no cloud)
 * Extracts products, prices, store info
 */

class ReceiptScanner {
    constructor() {
        this.worker = null;
        this.supportedStores = ['migros', 'lidl', 'esselunga', 'manor', 'wegmans', 'costco', 'walmart'];
        this.initWorker();
    }

    async initWorker() {
        this.worker = await Tesseract.createWorker('eng');
        await this.worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$.,/- ',
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
            tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
        });
    }

    async scanReceipt(imageFile, storeName = null) {
        if (!this.worker) await this.initWorker();
        
        // Preprocess image for better OCR accuracy [citation:7]
        const processedImage = await this.preprocessImage(imageFile);
        
        // Run OCR
        const { data: { text } } = await this.worker.recognize(processedImage);
        
        // Parse receipt based on store format
        const parsedData = this.parseReceipt(text, storeName);
        
        return parsedData;
    }

    async preprocessImage(imageFile) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Apply image enhancements for better OCR [citation:7]
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Convert to grayscale
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const gray = 0.299 * imageData.data[i] + 
                                 0.587 * imageData.data[i+1] + 
                                 0.114 * imageData.data[i+2];
                    imageData.data[i] = gray;
                    imageData.data[i+1] = gray;
                    imageData.data[i+2] = gray;
                }
                
                // Increase contrast
                const contrast = 1.5;
                for (let i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i] = this.adjustContrast(imageData.data[i], contrast);
                    imageData.data[i+1] = this.adjustContrast(imageData.data[i+1], contrast);
                    imageData.data[i+2] = this.adjustContrast(imageData.data[i+2], contrast);
                }
                
                ctx.putImageData(imageData, 0, 0);
                canvas.toBlob(resolve, 'image/png');
            };
            img.src = URL.createObjectURL(imageFile);
        });
    }

    adjustContrast(value, contrast) {
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        return Math.min(255, Math.max(0, factor * (value - 128) + 128));
    }

    parseReceipt(text, storeName) {
        const lines = text.split('\n');
        const items = [];
        let store = storeName || this.detectStore(text);
        let total = null;
        let date = null;
        
        // Pattern matching for product lines
        // Common receipt format: "Product Name 1.99 1" or "Product Name $2.99"
        const productPattern = /^(.+?)\s+[\$]?(\d+\.\d{2})(?:\s+(\d+))?/;
        const totalPattern = /(?:TOTAL|SUBTOTAL|AMOUNT DUE)[^\d]*[\$]?(\d+\.\d{2})/i;
        const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
        
        for (const line of lines) {
            // Skip empty lines
            if (!line.trim()) continue;
            
            // Check for total
            const totalMatch = line.match(totalPattern);
            if (totalMatch) {
                total = parseFloat(totalMatch[1]);
                continue;
            }
            
            // Check for date
            const dateMatch = line.match(datePattern);
            if (dateMatch && !date) {
                date = dateMatch[1];
                continue;
            }
            
            // Check for product
            const productMatch = line.match(productPattern);
            if (productMatch) {
                items.push({
                    name: productMatch[1].trim(),
                    price: parseFloat(productMatch[2]),
                    quantity: productMatch[3] ? parseInt(productMatch[3]) : 1,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return {
            store,
            date,
            total,
            items,
            rawText: text,
            scannedAt: new Date().toISOString()
        };
    }

    detectStore(text) {
        const storePatterns = {
            'wegmans': /wegmans/i,
            'costco': /costco/i,
            'walmart': /walmart|wal-mart/i,
            'target': /target/i,
            'trader joes': /trader\s*joes?/i,
            'whole foods': /whole\s*foods/i,
            'kroger': /kroger/i,
            'safeway': /safeway/i,
            'aldi': /aldi/i,
            'lidl': /lidl/i
        };
        
        for (const [store, pattern] of Object.entries(storePatterns)) {
            if (pattern.test(text)) return store;
        }
        
        return 'unknown';
    }

    async destroy() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}