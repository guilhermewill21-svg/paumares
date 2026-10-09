// ==UserScript==
// @name         RedeCanais Suite - Advanced Player & Channel Manager
// @namespace    http://tampermonkey.net/
// @version      2.0.2
// @description  Suite avancada para RedeCanais TV: captura e validacao de URLs de transmissao, troca rapida de canais, modo cinema, PiP, controle de velocidade e bloqueador de anuncios/popups.
// @author       TCC / College Project
// @match        http://*.redecanaistv.ae/*
// @match        https://*.redecanaistv.ae/*
// @match        http://redecanaistv.ae/*
// @match        https://redecanaistv.ae/*
// @include      *://*redecanais*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=redecanaistv.ae
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==UserScript==

(function () {
    'use strict';

    // UI Styles matching reference design
    const STYLES = `
        #rc-suite-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: #181925;
            color: #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 13px;
            z-index: 999999;
            overflow: hidden;
            transition: all 0.3s ease;
            user-select: none;
        }

        #rc-suite-panel.rc-minimized .rc-card-content {
            display: none;
        }

        .rc-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: #1e1f30;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            cursor: move;
        }

        .rc-card-title {
            font-weight: 700;
            font-size: 14px;
            color: #00f2fe;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .rc-card-controls span {
            cursor: pointer;
            padding: 2px 6px;
            font-size: 14px;
            color: #a0aec0;
            transition: color 0.2s;
        }

        .rc-card-controls span:hover {
            color: #ffffff;
        }

        .rc-card-content {
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .rc-section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #718096;
            margin-bottom: 6px;
        }

        .rc-input-box {
            width: 100%;
            background: #0f1019;
            border: 1px solid #00f2fe;
            border-radius: 6px;
            padding: 8px 12px;
            color: #ffffff;
            font-size: 13px;
            outline: none;
            box-sizing: border-box;
        }

        .rc-input-box:focus {
            box-shadow: 0 0 8px rgba(0, 242, 254, 0.4);
        }

        .rc-btn-group {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }

        .rc-btn {
            background: #27293d;
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #e2e8f0;
            padding: 8px 4px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            transition: background 0.2s, border-color 0.2s;
        }

        .rc-btn:hover {
            background: #323552;
            border-color: #00f2fe;
            color: #ffffff;
        }

        .rc-speed-control {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .rc-speed-val {
            color: #00f2fe;
            font-weight: 700;
        }

        .rc-toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: #cbd5e0;
        }

        .rc-switch {
            position: relative;
            display: inline-block;
            width: 38px;
            height: 20px;
        }

        .rc-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .rc-slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: #2d3748;
            transition: .3s;
            border-radius: 20px;
        }

        .rc-slider:before {
            position: absolute;
            content: "";
            height: 14px;
            width: 14px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
        }

        input:checked + .rc-slider {
            background-color: #00f2fe;
        }

        input:checked + .rc-slider:before {
            transform: translateX(18px);
        }

        .rc-channel-list {
            max-height: 140px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 4px;
            background: #0f1019;
            border-radius: 6px;
            padding: 6px;
        }

        .rc-channel-item {
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            color: #cbd5e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.2s;
        }

        .rc-channel-item:hover {
            background: #27293d;
            color: #00f2fe;
        }

        .rc-badge {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(0, 242, 254, 0.15);
            color: #00f2fe;
            font-weight: 600;
        }

        #rc-cinema-overlay {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.92);
            z-index: 999990;
            display: none;
        }

        body.rc-cinema-active #rc-cinema-overlay {
            display: block !important;
        }

        body.rc-cinema-active video,
        body.rc-cinema-active iframe[src*="ch.html"],
        body.rc-cinema-active iframe[name="Player"] {
            position: relative !important;
            z-index: 999995 !important;
            box-shadow: 0 0 50px rgba(0, 242, 254, 0.3) !important;
        }

        .rc-captured-box {
            background: #0f1019;
            padding: 8px;
            border-radius: 6px;
            border: 1px dashed #00f2fe;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .rc-captured-url {
            word-break: break-all;
            font-size: 11px;
            color: #a0aec0;
            font-family: monospace;
        }

        .rc-status-tag {
            align-self: flex-start;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
        }

        .rc-status-tag.valid {
            background: #10b981;
            color: #ffffff;
        }

        .rc-status-tag.checking {
            background: #f59e0b;
            color: #ffffff;
        }

        .rc-status-tag.invalid {
            background: #ef4444;
            color: #ffffff;
        }
    `;

    // Inject CSS
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(STYLES);
    } else {
        const styleEl = document.createElement('style');
        styleEl.textContent = STYLES;
        (document.head || document.documentElement).appendChild(styleEl);
    }

    // Helper functions for storage
    function getStoredVal(key, defaultVal) {
        if (typeof GM_getValue !== 'undefined') {
            return GM_getValue(key, defaultVal);
        }
        try {
            const item = localStorage.getItem('rc_suite_' + key);
            return item ? JSON.parse(item) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function setStoredVal(key, val) {
        if (typeof GM_setValue !== 'undefined') {
            GM_setValue(key, val);
        } else {
            try {
                localStorage.setItem('rc_suite_' + key, JSON.stringify(val));
            } catch (e) {}
        }
    }

    // State Management
    const RCSuite = {
        config: {
            blockPopups: getStoredVal('blockPopups', true),
            removeAds: getStoredVal('removeAds', true),
            autoPlay: getStoredVal('autoPlay', true),
            playbackSpeed: getStoredVal('playbackSpeed', 1.0)
        },
        capturedStreamUrl: '',
        recentChannels: getStoredVal('recentChannels', []),
        allChannels: [],

        saveConfig(key, val) {
            this.config[key] = val;
            setStoredVal(key, val);
            if (key === 'removeAds') toggleAdBlocking(val);
        },

        addRecentChannel(channel) {
            if (!channel || !channel.name || !channel.url) return;
            this.recentChannels = this.recentChannels.filter(c => c.url !== channel.url);
            this.recentChannels.unshift(channel);
            if (this.recentChannels.length > 8) this.recentChannels.pop();
            setStoredVal('recentChannels', this.recentChannels);
            renderRecentChannels();
        }
    };
    window.RCSuite = RCSuite;

    // POPUP & REDIRECT SUPPRESSION
    function enablePopupBlocking() {
        window.open = function () {
            console.log('[RC Suite] Popup/Window.open bloqueado.');
            return null;
        };

        // Suppress target="_blank" onclick redirect hijacking
        document.addEventListener('click', function (e) {
            if (!RCSuite.config.blockPopups) return;
            let target = e.target;
            while (target && target !== document) {
                if (target.tagName === 'A') {
                    const href = target.getAttribute('href') || '';
                    if (target.target === '_blank' && (href.includes('ads') || href.includes('pop') || href.startsWith('http') && !href.includes(window.location.hostname))) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[RC Suite] Redirecionamento/Ad Link bloqueado:', href);
                        return false;
                    }
                }
                target = target.parentNode;
            }
        }, true);
    }

    // ON-SCREEN AD REMOVAL
    function removeScreenAds() {
        if (!RCSuite.config.removeAds) return;

        const adSelectors = [
            'iframe[src*="chatango"]',
            'iframe[src*="pop"]',
            'iframe[src*="ad"]',
            'div[class*="banner"]',
            'div[id*="banner"]',
            'div[class*="ad-"]',
            'div[id*="ad-"]',
            '.propeller',
            '#popunder',
            'a[href*="bet"]'
        ];

        adSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Ensure we don't accidentally remove main player or suite UI
                if (!el.closest('#rc-suite-panel') && !el.getAttribute('name')?.includes('Player')) {
                    el.style.display = 'none';
                    el.remove();
                }
            });
        });
    }

    function toggleAdBlocking(enabled) {
        if (enabled) {
            removeScreenAds();
        }
    }

    // Stream Interception Logic
    function isStreamUrl(url) {
        if (!url || typeof url !== 'string') return false;
        return (
            url.includes('.m3u8') ||
            url.includes('.mp4') ||
            url.includes('stream') ||
            url.includes('/hls/') ||
            url.includes('cdn') ||
            url.includes('ch.html')
        );
    }

    function validateStreamUrl(url) {
        const urlEl = document.getElementById('rc-stream-url');
        const statusEl = document.getElementById('rc-stream-status');
        if (!urlEl || !statusEl) return;

        RCSuite.capturedStreamUrl = url;
        urlEl.textContent = url;
        statusEl.textContent = 'VALIDANDO...';
        statusEl.className = 'rc-status-tag checking';

        const checkRequest = (typeof GM_xmlhttpRequest !== 'undefined') ? GM_xmlhttpRequest : null;

        if (checkRequest) {
            checkRequest({
                method: 'HEAD',
                url: url,
                timeout: 5000,
                onload: function (response) {
                    if (response.status >= 200 && response.status < 400) {
                        statusEl.textContent = 'ONLINE \u2713';
                        statusEl.className = 'rc-status-tag valid';
                    } else {
                        statusEl.textContent = 'VERIFICAR URL';
                        statusEl.className = 'rc-status-tag invalid';
                    }
                },
                onerror: function () {
                    statusEl.textContent = 'ERRO / OFFLINE';
                    statusEl.className = 'rc-status-tag invalid';
                },
                ontimeout: function () {
                    statusEl.textContent = 'TIMEOUT';
                    statusEl.className = 'rc-status-tag invalid';
                }
            });
        } else {
            fetch(url, { method: 'HEAD', mode: 'no-cors' }).then(() => {
                statusEl.textContent = 'ONLINE \u2713';
                statusEl.className = 'rc-status-tag valid';
            }).catch(() => {
                statusEl.textContent = 'CAPTURADA';
                statusEl.className = 'rc-status-tag valid';
            });
        }
    }

    // Intercept fetch & XHR
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const url = args[0] ? (typeof args[0] === 'string' ? args[0] : args[0].url) : '';
        if (isStreamUrl(url)) {
            validateStreamUrl(url);
        }
        return originalFetch.apply(this, args);
    };

    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        if (isStreamUrl(url)) {
            validateStreamUrl(url);
        }
        return originalXHR.apply(this, [method, url, ...rest]);
    };

    // PLAYER CONTROLS (Cinema, PiP, Fullscreen, Speed, AutoPlay)
    function getMainVideoElement() {
        return document.querySelector('video');
    }

    function toggleCinemaMode() {
        document.body.classList.toggle('rc-cinema-active');
    }

    async function togglePiP() {
        const video = getMainVideoElement();
        if (!video) {
            alert('Nenhum player de video HTML5 diretamente detectado nesta estrutura.');
            return;
        }
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await video.requestPictureInPicture();
            }
        } catch (err) {
            console.error('[RC Suite] Erro PiP:', err);
        }
    }

    function toggleFullscreen() {
        const target = getMainVideoElement() || document.querySelector('iframe[name="Player"]') || document.documentElement;
        if (!document.fullscreenElement) {
            if (target.requestFullscreen) target.requestFullscreen();
            else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }

    function setPlaybackSpeed(speed) {
        speed = Math.max(0.25, Math.min(3.0, parseFloat(speed.toFixed(2))));
        RCSuite.saveConfig('playbackSpeed', speed);

        const display = document.getElementById('rc-speed-display');
        if (display) display.textContent = `${speed}x`;

        document.querySelectorAll('video').forEach(v => {
            v.playbackRate = speed;
        });
    }

    function applyAutoPlay() {
        if (!RCSuite.config.autoPlay) return;
        document.querySelectorAll('video').forEach(v => {
            if (v.paused) {
                v.play().catch(() => {});
            }
        });
    }

    // Monitor Video Elements & Iframes
    function scanMediaElements() {
        removeScreenAds();
        applyAutoPlay();

        document.querySelectorAll('video').forEach(video => {
            video.playbackRate = RCSuite.config.playbackSpeed;
            if (video.src && isStreamUrl(video.src)) {
                validateStreamUrl(video.src);
            }
            video.querySelectorAll('source').forEach(src => {
                if (src.src && isStreamUrl(src.src)) {
                    validateStreamUrl(src.src);
                }
            });
        });

        document.querySelectorAll('iframe').forEach(iframe => {
            if (iframe.src && (iframe.src.includes('ch.html') || iframe.src.includes('player'))) {
                if (!RCSuite.capturedStreamUrl) {
                    validateStreamUrl(iframe.src);
                }
            }
        });
    }

    // Channel Scraping & Filtering
    function scrapePageChannels() {
        const channels = [];
        const links = document.querySelectorAll('a[href*="-ao-vivo"], a[href*="assistir-"], .canal-item, .thumb');

        links.forEach(link => {
            const title = (link.getAttribute('title') || link.innerText || link.getAttribute('alt') || '').trim();
            const href = link.href;
            if (title && href && title.length > 2 && !channels.some(c => c.url === href)) {
                channels.push({ name: title, url: href });
            }
        });

        RCSuite.allChannels = channels;
    }

    function renderRecentChannels() {
        const container = document.getElementById('rc-recent-list');
        if (!container) return;

        if (RCSuite.recentChannels.length === 0) {
            container.innerHTML = `<div style="color: #718096; text-align: center; font-size: 11px; padding: 6px;">Nenhum canal recente.</div>`;
            return;
        }

        container.innerHTML = RCSuite.recentChannels.map(c => `
            <div class="rc-channel-item" data-url="${c.url}">
                <span>\uD83D\uDCFA ${c.name}</span>
                <span class="rc-badge">Acessar</span>
            </div>
        `).join('');

        container.querySelectorAll('.rc-channel-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.getAttribute('data-url');
                if (url) window.location.href = url;
            });
        });
    }

    function setupSearch() {
        const input = document.getElementById('rc-channel-search');
        const results = document.getElementById('rc-search-results');
        if (!input || !results) return;

        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                results.style.display = 'none';
                results.innerHTML = '';
                return;
            }

            const matches = RCSuite.allChannels.filter(c => c.name.toLowerCase().includes(query)).slice(0, 10);
            if (matches.length === 0) {
                results.innerHTML = `<div style="color: #718096; padding: 6px; font-size: 11px;">Nenhum canal encontrado.</div>`;
            } else {
                results.innerHTML = matches.map(c => `
                    <div class="rc-channel-item" data-url="${c.url}" data-name="${c.name}">
                        <span>\u25B6 ${c.name}</span>
                        <span class="rc-badge">Trocar</span>
                    </div>
                `).join('');

                results.querySelectorAll('.rc-channel-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const url = item.getAttribute('data-url');
                        const name = item.getAttribute('data-name');
                        if (url) {
                            RCSuite.addRecentChannel({ name, url });
                            window.location.href = url;
                        }
                    });
                });
            }
            results.style.display = 'flex';
        });
    }

    // Render Floating Panel
    function buildUI() {
        if (document.getElementById('rc-suite-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'rc-suite-panel';
        panel.innerHTML = `
            <div class="rc-card-header" id="rc-suite-header">
                <div class="rc-card-title">\uD83D\uDCFA RedeCanais Suite</div>
                <div class="rc-card-controls">
                    <span id="rc-minimize-btn" title="Minimizar / Expandir">&#8212;</span>
                </div>
            </div>
            <div class="rc-card-content">
                <div>
                    <div class="rc-section-title">BUSCA R&Aacute;PIDA DE CANAIS</div>
                    <input type="text" id="rc-channel-search" class="rc-input-box" placeholder="Ex: HBO, Sportv, Telecine..." />
                    <div id="rc-search-results" class="rc-channel-list" style="display:none; margin-top:6px;"></div>
                </div>

                <div>
                    <div class="rc-section-title">CONTROLES DO PLAYER</div>
                    <div class="rc-btn-group">
                        <button class="rc-btn" id="rc-btn-cinema">\uD83C\uDFAD Cinema</button>
                        <button class="rc-btn" id="rc-btn-pip">\uD83D\uDCFA PiP</button>
                        <button class="rc-btn" id="rc-btn-fullscreen">\u2191 Fullscreen</button>
                    </div>
                </div>

                <div>
                    <div class="rc-speed-control">
                        <span class="rc-section-title">Velocidade de Reprodu&ccedil;&atilde;o:</span>
                        <span class="rc-speed-val" id="rc-speed-display">${RCSuite.config.playbackSpeed}x</span>
                    </div>
                    <div class="rc-btn-group" style="margin-top: 6px;">
                        <button class="rc-btn" id="rc-speed-down">- 0.25x</button>
                        <button class="rc-btn" id="rc-speed-reset">1.0x</button>
                        <button class="rc-btn" id="rc-speed-up">+ 0.25x</button>
                    </div>
                </div>

                <div>
                    <div class="rc-section-title">CONFIGURA&Ccedil;&Otilde;ES</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div class="rc-toggle-row">
                            <span>Bloquear Popups & Redirects</span>
                            <label class="rc-switch">
                                <input type="checkbox" id="rc-toggle-popups" ${RCSuite.config.blockPopups ? 'checked' : ''}>
                                <span class="rc-slider"></span>
                            </label>
                        </div>
                        <div class="rc-toggle-row">
                            <span>Remover An&uacute;ncios da Tela</span>
                            <label class="rc-switch">
                                <input type="checkbox" id="rc-toggle-ads" ${RCSuite.config.removeAds ? 'checked' : ''}>
                                <span class="rc-slider"></span>
                            </label>
                        </div>
                        <div class="rc-toggle-row">
                            <span>Auto-Play do Player</span>
                            <label class="rc-switch">
                                <input type="checkbox" id="rc-toggle-autoplay" ${RCSuite.config.autoPlay ? 'checked' : ''}>
                                <span class="rc-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="rc-section-title">URL DE TRANSMISS&Atilde;O DETECTADA</div>
                    <div class="rc-captured-box">
                        <span id="rc-stream-status" class="rc-status-tag checking">AGUARDANDO...</span>
                        <div class="rc-captured-url" id="rc-stream-url">Nenhuma URL capturada ainda.</div>
                    </div>
                </div>

                <div>
                    <div class="rc-section-title">&Uacute;LTIMOS CANAIS ASSISTIDOS</div>
                    <div class="rc-channel-list" id="rc-recent-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        const cinemaOverlay = document.createElement('div');
        cinemaOverlay.id = 'rc-cinema-overlay';
        cinemaOverlay.addEventListener('click', toggleCinemaMode);
        document.body.appendChild(cinemaOverlay);

        makeDraggable(panel, document.getElementById('rc-suite-header'));
        setupUIEvents();
        scrapePageChannels();
        setupSearch();
        renderRecentChannels();

        // Check page title for channel registration
        const pageTitle = document.title.split('-')[0].trim();
        if (pageTitle && pageTitle.length > 2 && window.location.href.includes('-ao-vivo')) {
            RCSuite.addRecentChannel({ name: pageTitle, url: window.location.href });
        }

        setInterval(scanMediaElements, 2000);
    }

    // Draggable utility
    function makeDraggable(elmnt, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            if (e.target.id === 'rc-minimize-btn') return;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            elmnt.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function setupUIEvents() {
        const panel = document.getElementById('rc-suite-panel');
        document.getElementById('rc-minimize-btn').addEventListener('click', () => {
            panel.classList.toggle('rc-minimized');
        });

        // Player buttons
        document.getElementById('rc-btn-cinema').addEventListener('click', toggleCinemaMode);
        document.getElementById('rc-btn-pip').addEventListener('click', togglePiP);
        document.getElementById('rc-btn-fullscreen').addEventListener('click', toggleFullscreen);

        // Speed buttons
        document.getElementById('rc-speed-down').addEventListener('click', () => {
            setPlaybackSpeed(RCSuite.config.playbackSpeed - 0.25);
        });
        document.getElementById('rc-speed-reset').addEventListener('click', () => {
            setPlaybackSpeed(1.0);
        });
        document.getElementById('rc-speed-up').addEventListener('click', () => {
            setPlaybackSpeed(RCSuite.config.playbackSpeed + 0.25);
        });

        // Config toggles
        document.getElementById('rc-toggle-popups').addEventListener('change', (e) => {
            RCSuite.saveConfig('blockPopups', e.target.checked);
        });

        document.getElementById('rc-toggle-ads').addEventListener('change', (e) => {
            RCSuite.saveConfig('removeAds', e.target.checked);
        });

        document.getElementById('rc-toggle-autoplay').addEventListener('change', (e) => {
            RCSuite.saveConfig('autoPlay', e.target.checked);
        });
    }

    // Enable early popup blocking
    enablePopupBlocking();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildUI);
    } else {
        buildUI();
    }
})();
