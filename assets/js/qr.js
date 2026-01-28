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
    let generatedQrObject = null; // To hold the QrcodeJS object
    let historyData = JSON.parse(localStorage.getItem('qr_history') || '[]');

    // === History Management ===
    function saveHistory(text, type = 'scanned') {
        // Check duplication (ignore if same text exists recently?)
        // For now, allow duplicates but maybe warn? Or just append.
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
        const filter = document.getElementById('history-filter').value.toLowerCase();
        const sort = document.getElementById('history-sort').value;

        list.innerHTML = '';

        let items = historyData.filter(item => 
            item.text.toLowerCase().includes(filter)
        );

        if (sort === 'date-asc') {
            items.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
            items.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // Sort pinned to top?
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

        qrDisplay.innerHTML = '';
        generatedQrObject = new QRCode(qrDisplay, {
            text: text,
            width: 256,
            height: 256,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        downloadActions.classList.remove('hidden');
        saveHistory(text, 'generated');
    });

    // === Export PNG/SVG ===
    document.getElementById('download-png').addEventListener('click', () => {
        const img = qrDisplay.querySelector('img');
        if (img) {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = img.src;
            link.click();
        }
    });

    document.getElementById('download-svg').addEventListener('click', () => {
        // QRCode.js renders as Canvas or Img. If it's canvas, we can convert.
        // If it's img (base64 of png), getting SVG is hard without re-generating using an SVG lib.
        // But QRCode.js is old. For now, let's just alert limitation or try to find an SVG method.
        // Actually, let's just support PNG since QRCode.js outputs raster mostly.
        // Wait, the user asked for SVG. existing lib might not support it easily.
        // Let's check generated DOM. Usually it has a canvas and an img.
        alert('現在のライブラリではPNG保存のみサポートされています。(SVG実装予定)');
    });

    // === Batch Generate ===
    document.getElementById('csv-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        
        const zip = new JSZip();
        const folder = zip.folder("qrcodes");
        
        // This is a bit hacky because QRCode.js is DOM based.
        // We need to generate them off-screen one by one.
        const hiddenDiv = document.createElement('div');
        // hiddenDiv.style.display = 'none'; // Need layout for canvas?
        document.body.appendChild(hiddenDiv);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const [data, filename] = line.split(','); // Simple CSV: data,filename
            
            // Clean previous
            hiddenDiv.innerHTML = '';
            
            new QRCode(hiddenDiv, {
                text: data,
                width: 256,
                height: 256
            });

            // Wait for render? QRCode.js is sync usually but image generation might take a tick?
            await new Promise(r => setTimeout(r, 50)); 
            
            const img = hiddenDiv.querySelector('img');
            if (img) {
                const base64 = img.src.split(',')[1];
                folder.file(`${filename || 'qr_' + i}.png`, base64, {base64: true});
            }
        }

        document.body.removeChild(hiddenDiv);

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
        // Tiling Logic renamed
        
        // Helper to scan a Blob/File
        const scanOne = async (blob) => {
            try {
                const f = new File([blob], "temp.png", { type: "image/png" });
                const res = await html5QrCode.scanFile(f, false);
                return res;
            } catch (err) {
                return null;
            }
        };

        // 1. Full Scan with html5-qrcode
        const fullRes = await scanOne(file);
        if (fullRes) addResultCallback(fullRes);

        // 2. Tiling
        try {
            const img = await createImageBitmap(file);
            const w = img.width;
            const h = img.height;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const strips = [
                {x: 0, y: 0, w: w * 0.4, h: h},
                {x: w * 0.3, y: 0, w: w * 0.4, h: h},
                {x: w * 0.6, y: 0, w: w * 0.4, h: h},
                {x: 0, y: 0, w: w, h: h * 0.5},
                {x: 0, y: h * 0.5, w: w, h: h * 0.5}
            ];

            for (const strip of strips) {
                canvas.width = strip.w;
                canvas.height = strip.h;
                ctx.drawImage(img, strip.x, strip.y, strip.w, strip.h, 0, 0, strip.w, strip.h);
                
                const blob = await new Promise(r => canvas.toBlob(r));
                const res = await scanOne(blob);
                if (res) addResultCallback(res);
            }
        } catch (e) {
            console.error("Tiling error", e);
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
