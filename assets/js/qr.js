document.addEventListener('DOMContentLoaded', () => {
    // === Tab Switching ===
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });

    // === Global Variables ===
    const qrDisplay = document.getElementById('qrcode');
    const qrResultList = document.getElementById('qr-results-list');
    let historyData = JSON.parse(localStorage.getItem('qr_history') || '[]');
    let currentLogo = null;

    // Initialize QR Styling
    const qrStyling = new QRCodeStyling({
        width: 300,
        height: 300,
        type: "svg",
        data: "https://kits-tools.net",
        image: null,
        dotsOptions: { color: "#000000", type: "square" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "square" },
        imageOptions: { crossOrigin: "anonymous", margin: 10 }
    });

    qrStyling.append(qrDisplay);

    // === Customization Logic ===
    const toggleCustom = document.getElementById('toggle-custom');
    const customOptions = document.getElementById('custom-options');
    const dotColorInput = document.getElementById('qr-dot-color');
    const bgColorInput = document.getElementById('qr-bg-color');
    const dotTypeSelect = document.getElementById('qr-dot-type');
    const cornerTypeSelect = document.getElementById('qr-corner-type');
    const logoInput = document.getElementById('logo-input');
    const removeLogoBtn = document.getElementById('remove-logo');

    toggleCustom.addEventListener('click', () => {
        customOptions.classList.toggle('hidden');
    });

    function updateQR() {
        const text = document.getElementById('qr-text').value || "https://kits-tools.net";
        qrStyling.update({
            data: text,
            dotsOptions: {
                color: dotColorInput.value,
                type: dotTypeSelect.value
            },
            backgroundOptions: {
                color: bgColorInput.value
            },
            cornersSquareOptions: {
                type: cornerTypeSelect.value
            },
            image: currentLogo
        });
    }

    [dotColorInput, bgColorInput, dotTypeSelect, cornerTypeSelect].forEach(el => {
        el.addEventListener('change', updateQR);
    });

    logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentLogo = event.target.result;
                removeLogoBtn.classList.remove('hidden');
                updateQR();
            };
            reader.readAsDataURL(file);
        }
    });

    removeLogoBtn.addEventListener('click', () => {
        currentLogo = null;
        logoInput.value = '';
        removeLogoBtn.classList.add('hidden');
        updateQR();
    });

    // === History Management ===
    function saveHistory(text, type = 'scanned') {
        const newItem = {
            id: Date.now(),
            text: text,
            date: new Date().toISOString(),
            type: type,
            pinned: false
        };
        historyData.unshift(newItem);
        localStorage.setItem('qr_history', JSON.stringify(historyData));
        renderHistory();
    }

    function renderHistory() {
        const list = document.getElementById('history-list');
        const filterStr = document.getElementById('history-filter').value.toLowerCase();
        const sortVal = document.getElementById('history-sort').value;

        list.innerHTML = '';

        let items = historyData.filter(item => 
            item.text.toLowerCase().includes(filterStr)
        );

        if (sortVal === 'date-asc') {
            items.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
            items.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        items.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

        items.forEach(item => {
            const dateStr = new Date(item.date).toLocaleString();
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-content">
                    <div>${item.text}</div>
                    <div class="history-meta">${item.type === 'generated' ? '作成' : '読み取り'} - ${dateStr}</div>
                </div>
                <div class="history-actions">
                    <button class="history-btn ${item.pinned ? 'pinned' : ''}" onclick="togglePin(${item.id})">
                        <i class="fa-solid fa-thumbtack"></i>
                    </button>
                    <button class="history-btn" onclick="copyToClipboard('${item.text}')">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <button class="history-btn" onclick="deleteHistory(${item.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(el);
        });
    }

    // Expose history functions to window for onclick
    window.togglePin = (id) => {
        const item = historyData.find(i => i.id === id);
        if (item) {
            item.pinned = !item.pinned;
            localStorage.setItem('qr_history', JSON.stringify(historyData));
            renderHistory();
        }
    };

    window.deleteHistory = (id) => {
        historyData = historyData.filter(i => i.id !== id);
        localStorage.setItem('qr_history', JSON.stringify(historyData));
        renderHistory();
    };

    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('コピーしました');
    };

    document.getElementById('history-filter').addEventListener('input', renderHistory);
    document.getElementById('history-sort').addEventListener('change', renderHistory);
    document.getElementById('clear-history').addEventListener('click', () => {
        if(confirm('履歴を全て削除しますか？ (ピン留めも削除されます)')) {
            historyData = [];
            localStorage.setItem('qr_history', '[]');
            renderHistory();
        }
    });

    renderHistory(); // Initial render

    // === Generate QR ===
    const generateBtn = document.getElementById('generate-btn');
    const qrText = document.getElementById('qr-text');
    const downloadActions = document.getElementById('download-actions');

    generateBtn.addEventListener('click', () => {
        const text = qrText.value;
        if (!text) return;

        updateQR();
        downloadActions.classList.remove('hidden');
        saveHistory(text, 'generated');
    });

    // === Export PNG/SVG ===
    document.getElementById('download-png').addEventListener('click', () => {
        qrStyling.download({ name: "qrcode", extension: "png" });
    });

    document.getElementById('download-svg').addEventListener('click', () => {
        qrStyling.download({ name: "qrcode", extension: "svg" });
    });

    // === Batch Generate ===
    const batchGenerateBtn = document.getElementById('batch-generate-btn');
    let batchLines = [];

    document.getElementById('csv-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        batchLines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        
        if (batchLines.length > 0) {
            batchGenerateBtn.classList.remove('hidden');
        }
    });

    batchGenerateBtn.addEventListener('click', async () => {
        const zip = new JSZip();
        const folder = zip.folder("qrcodes");
        
        // Use a temporary instance to not disturb UI
        const tempStyling = new QRCodeStyling({
            width: 512,
            height: 512,
            dotsOptions: {
                color: dotColorInput.value,
                type: dotTypeSelect.value
            },
            backgroundOptions: {
                color: bgColorInput.value
            },
            cornersSquareOptions: {
                type: cornerTypeSelect.value
            },
            image: currentLogo,
            imageOptions: { crossOrigin: "anonymous", margin: 10 }
        });

        for (let i = 0; i < batchLines.length; i++) {
            const line = batchLines[i];
            const [data, filename] = line.split(',');
            
            tempStyling.update({ data: data });
            
            // Get blob
            const blob = await tempStyling.getRawData("png");
            folder.file(`${filename || 'qr_' + i}.png`, blob);
        }

        const content = await zip.generateAsync({type:"blob"});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "qrcodes.zip";
        link.click();
    });

    // === Reading Features ===
    const fileInput = document.getElementById('qr-input-file');
    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    const scanScreenBtn = document.getElementById('scan-screen');
    const html5QrCode = new Html5Qrcode("reader");

    function displayResult(text) {
        // Multi-result support UI
        // But html5-qrcode standard only returns one.
        // We'll append to list for session.
        const p = document.createElement('p');
        p.className = 'result-text';
        p.innerText = text;
        qrResultList.prepend(p); // Add to top
        saveHistory(text, 'scanned');
    }

    // Single File Scan
    fileInput.addEventListener('change', e => {
        if (e.target.files.length == 0) return;
        scanFile(e.target.files[0]);
    });

    async function scanFile(file) {
        // Display Preview
        const previewImg = document.getElementById('qr-preview');
        const previewContainer = document.getElementById('qr-preview-container');
        if (file instanceof Blob) {
            const url = URL.createObjectURL(file);
            previewImg.src = url;
            previewContainer.classList.remove('hidden');
        }

        const uniqueHandler = new Set();
        // We already have history check but let's ensure we don't spam UI for this single file scan
        
        // Helper to add results
        const addResult = (text) => {
            if (!uniqueHandler.has(text)) {
                uniqueHandler.add(text);
                displayResult(text);
            }
        };

        let strategiesRun = [];

        // 1. Native BarcodeDetector
        if ('BarcodeDetector' in window) {
            strategiesRun.push((async () => {
                try {
                    const detector = new BarcodeDetector({formats: ['qr_code']});
                    const bmp = await createImageBitmap(file);
                    const barcodes = await detector.detect(bmp);
                    // Sort by X to be nice
                    barcodes.sort((a,b) => a.boundingBox.x - b.boundingBox.x);
                    barcodes.forEach(code => addResult(code.rawValue));
                } catch (e) {
                    console.warn("BarcodeDetector error", e);
                }
            })());
        }

        // 2. Tiling Fallback (html5-qrcode)
        // We run this ALWAYS now if we want maximum coverage, OR we can run it only if Native found < X?
        // User says "3 codes, found 2". Native missed one. So we should run tiling too.
        // To be safe and robust, let's run tiling as well, or at least a "full scan" pass with html5-qrcode.
        
        strategiesRun.push((async () => {
             await scanFileFallbackInternal(file, addResult);
        })());

        await Promise.all(strategiesRun);

        if (uniqueHandler.size === 0) {
            alert("QRコードが見つかりませんでした。");
        }
    }

    async function scanFileFallbackInternal(file, addResultCallback) {
        // Advanced Preprocessing + Tiling Strategy
        
        const scanOne = async (source) => {
            const results = [];
            
            // Helper to try jsQR on a canvas
            const tryJsQR = (canvas) => {
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                return code ? code.data : null;
            };

            try {
                // 1. Try html5-qrcode
                let f;
                let canvasForJsQR = null;

                if (source instanceof HTMLCanvasElement) {
                    canvasForJsQR = source;
                    const blob = await new Promise(r => source.toBlob(r, 'image/png'));
                    f = new File([blob], "temp.png", { type: "image/png" });
                } else if (source instanceof Blob) {
                    f = new File([source], "temp.png", { type: "image/png" });
                    // Create canvas for jsQR if needed
                    const img = await createImageBitmap(source);
                    canvasForJsQR = document.createElement('canvas');
                    canvasForJsQR.width = img.width;
                    canvasForJsQR.height = img.height;
                    canvasForJsQR.getContext('2d').drawImage(img, 0,0);
                } else {
                    f = source;
                }

                try {
                    const res = await html5QrCode.scanFile(f, false);
                    if (res) results.push(res);
                } catch(e) {}

                // 2. Try jsQR (Secondary Engine)
                if (canvasForJsQR) {
                    const res = tryJsQR(canvasForJsQR);
                    if (res) results.push(res);
                }

                return results.length > 0 ? results : null;
            } catch (err) {
                return null;
            }
        };

        // Versatile preprocessing helper
        const getProcessedCanvas = (img, sx, sy, sw, sh, mode = 'contrast', param = 1.5) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = sw;
            canvas.height = sh;
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            
            const imageData = ctx.getImageData(0, 0, sw, sh);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
                let val;
                
                if (mode === 'binarize') {
                    // Constant threshold
                    val = gray > param ? 255 : 0;
                } else {
                    // Contrast
                    const contrast = param;
                    const intercept = 128 * (1 - contrast);
                    val = gray * contrast + intercept;
                    if (val > 255) val = 255;
                    if (val < 0) val = 0;
                }
                data[i] = data[i+1] = data[i+2] = val;
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        };

        const img = await createImageBitmap(file);
        const w = img.width;
        const h = img.height;

        // 1. Full Scan Passes
        const passes = [
            { mode: 'original', source: file },
            { mode: 'binarize', param: 128 },
            { mode: 'binarize', param: 180 }, // Higher threshold for light/faded
            { mode: 'contrast', param: 1.8 }
        ];

        for (const pass of passes) {
            let res;
            if (pass.mode === 'original') {
                res = await scanOne(pass.source);
            } else {
                const canvas = getProcessedCanvas(img, 0, 0, w, h, pass.mode, pass.param);
                res = await scanOne(canvas);
            }
            if (res) {
                if (Array.isArray(res)) res.forEach(r => addResultCallback(r));
                else addResultCallback(res);
            }
        }

        // 2. Tiling Passes
        const strips = [
            {x: 0, y: 0, w: w * 0.4, h: h},
            {x: w * 0.3, y: 0, w: w * 0.4, h: h},
            {x: w * 0.6, y: 0, w: w * 0.4, h: h},
            {x: 0, y: 0, w: w, h: h * 0.5},
            {x: 0, y: h * 0.5, w: w, h: h * 0.5}
        ];

        for (const s of strips) {
            // Original strip
            const cOrig = document.createElement('canvas');
            cOrig.width = s.w; cOrig.height = s.h;
            cOrig.getContext('2d').drawImage(img, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
            const resOrig = await scanOne(cOrig);
            if (resOrig) {
                if (Array.isArray(resOrig)) resOrig.forEach(r => addResultCallback(r));
                else addResultCallback(resOrig);
            }

            // Binarized strip
            const cBin = getProcessedCanvas(img, s.x, s.y, s.w, s.h, 'binarize', 128);
            const resBin = await scanOne(cBin);
            if (resBin) {
                if (Array.isArray(resBin)) resBin.forEach(r => addResultCallback(r));
                else addResultCallback(resBin);
            }
        }
    }

    // Drag & Drop / Paste
    const dropZone = document.getElementById('drop-zone');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            scanFile(e.dataTransfer.files[0]);
        }
    });

    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                scanFile(blob);
            }
        }
    });

    // Screen Share
    scanScreenBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "never" } });
            const track = stream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);
            const bitmap = await imageCapture.grabFrame();
            
            // Scan bitmap
             if ('BarcodeDetector' in window) {
                const detector = new BarcodeDetector({formats: ['qr_code']});
                const barcodes = await detector.detect(bitmap);
                if(barcodes.length > 0) {
                    barcodes.forEach(code => displayResult(code.rawValue));
                } else {
                    alert("QRコードが見つかりませんでした。");
                }
             } else {
                 // Fallback: draw to canvas and use html5-qrcode? hard without file.
                 // Actually html5-qrcode needs file or camera stream.
                 // We can use the stream with html5qrcode!
                 alert("このブラウザはBarcodeDetector非対応のため、画面キャプチャ読み取りは限定的です。");
             }

            track.stop(); // Stop sharing immediately after grab
        } catch(err) {
            console.error("Screen scan error", err);
        }
    });

    // Camera
    let isCameraRunning = false;
    startCameraBtn.addEventListener('click', () => {
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
            displayResult(decodedText);
            // Optionally stop?
        }).then(() => {
            isCameraRunning = true;
            startCameraBtn.classList.add('hidden');
            stopCameraBtn.classList.remove('hidden');
        }).catch(err => alert(`カメラ起動エラー: ${err}`));
    });

    stopCameraBtn.addEventListener('click', () => {
         if (isCameraRunning) {
            html5QrCode.stop().then(() => {
                isCameraRunning = false;
                startCameraBtn.classList.remove('hidden');
                stopCameraBtn.classList.add('hidden');
            });
        }
    });
});
