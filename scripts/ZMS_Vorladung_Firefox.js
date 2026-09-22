javascript: (function() {
    try {
        if (document.getElementById('zmsSearchWidget')) return;

        function el(tag, props) {
            const node = document.createElement(tag);
            if (props) Object.assign(node, props);
            return node
        }

        function getIdParam() {
            try {
                const url = new URL(location.href);
                const id = url.searchParams.get('id');
                if (id) return id;
                const c = document.querySelector('a[href*="counter.php?id="], form[action*="counter.php?id="]');
                if (c) {
                    const src = c.href || c.action || '';
                    const m = src.match(/[?&]id=(\d+)/);
                    if (m) return m[1]
                }
            } catch (_) {}
            return '3809'
        }

        function normMonth(s) {
            return String(s).toLowerCase().trim().replace(/\.$/, '').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/Ã¤/g, 'ae').replace(/Ã¶/g, 'oe').replace(/Ã¼/g, 'ue').replace(/ÃŸ/g, 'ss')
        }

        function dateFromHeader() {
            try {
                const header = document.querySelector('strong.date');
                if (!header) return null;
                const text = header.textContent.trim();
                const m = text.match(/(\d{1,2})\.\s*([A-Za-zÄÖÜäöüßÃ„Ã–ÃœÃ¤Ã¶Ã¼ÃŸ\.]+)\s+(\d{4})/);
                if (!m) return null;
                const day = parseInt(m[1], 10);
                const monthName = normMonth(m[2]);
                const year = parseInt(m[3], 10);
                const months = {
                    januar: 0,
                    jan: 0,
                    februar: 1,
                    feb: 1,
                    maerz: 2,
                    marz: 2,
                    maer: 2,
                    märz: 2,
                    april: 3,
                    apr: 3,
                    mai: 4,
                    juni: 5,
                    jun: 5,
                    juli: 6,
                    jul: 6,
                    august: 7,
                    aug: 7,
                    september: 8,
                    sept: 8,
                    sep: 8,
                    oktober: 9,
                    okt: 9,
                    november: 10,
                    nov: 10,
                    dezember: 11,
                    dez: 11
                };
                if (!(monthName in months)) return null;
                return new Date(year, months[monthName], day)
            } catch (_) {
                return null
            }
        }

        function formatDate(d) {
            return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
        }

        function showRes(type, msg, html) {
            const r = document.getElementById('zmsResult');
            const colors = {
                success: {
                    bg: '#e6ffed',
                    c: '#1a7f37',
                    b: '#8ce99a'
                },
                error: {
                    bg: '#ffe6e6',
                    c: '#b71c1c',
                    b: '#ff8a80'
                },
                info: {
                    bg: '#e6f7ff',
                    c: '#005c99',
                    b: '#80d4ff'
                }
            };
            const s = colors[type] || colors.info;
            r.style.cssText = `display:block;background:${s.bg};color:${s.c};border:1px solid ${s.b};padding:12px;border-radius:12px;margin-top:14px;white-space:pre-wrap;word-break:break-word;font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,0.15);transform:translateY(-10px);animation:fadeIn 0.3s forwards;`;
            r.innerHTML = html || msg || ''
        }
        async function copyTextRich(plain, html) {
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    const item = new ClipboardItem({
                        'text/plain': new Blob([plain], {
                            type: 'text/plain'
                        }),
                        'text/html': new Blob([html], {
                            type: 'text/html'
                        })
                    });
                    await navigator.clipboard.write([item]);
                    return true
                } catch (_) {}
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(plain);
                return false
            }
            throw new Error('Zwischenablage wird in diesem Browser nicht unterstützt.')
        }

        function formatDateFromUnix(u) {
            return formatDate(new Date(Number(u) * 1000))
        }

        function buildTextFromUrl(u) {
            const url = new URL(u);
            const time = (url.searchParams.get('Uhrzeit') || '00:00:00').slice(0, 5);
            const datumUnix = url.searchParams.get('Datum') || '';
            const vorgang = url.searchParams.get('Vorgangsnr') || '';
            const datum = datumUnix ? formatDateFromUnix(datumUnix) : '??.??.????';
            const plain = `,</p><p>vielen Dank für Ihren Antrag.</p><p>In Ihrer Aufenthaltsangelegenheit werden Sie gebeten, unter Vorlage dieses Schreibens\n\nam ${datum} um ${time} Uhr persönlich vorzusprechen und\nim Warteraum 251 / 266 (Haus B, 2. Etage) zu warten\nbis Ihre Wartenummer ${vorgang}\n\nan der Anzeigetafel erscheint.\nBitte nehmen Sie den Termin unbedingt wahr, weitere freie Termine stehen erst ab ca. 6 Wochen zur Verfügung.`;
            const html = `<div style="font-family:BerlinTypeOffice, Berlin Type Office, sans-serif; font-size:11pt;"><p>,</p><br><br><p>vielen Dank für Ihren Antrag.</p><br><br><p>In Ihrer Aufenthaltsangelegenheit werden Sie gebeten, unter Vorlage dieses Schreibens</p><br><br><table cellpadding="0" cellspacing="0" width="454"><tr><td style="border:3px solid red; background:#e6f9ff; padding:8px 10px; text-align:justify; line-height:1.4;">am <b>${datum}</b> um <b>${time}</b> Uhr persönlich vorzusprechen und im Warteraum <b>251 / 266</b> (Haus B, 2. Etage) zu warten, bis Ihre Wartenummer <b>${vorgang}</b> an der Anzeigetafel erscheint.</td></tr></table><br><br><p>Bitte nehmen Sie den Termin unbedingt wahr, weitere freie Termine stehen erst ab ca. 6 Wochen zur Verfügung.</p></div>`;
            return {
                plain: plain,
                html: html
            }
        }
        async function searchNum() {
            const num = document.getElementById('zmsNumberInput').value.trim();
            if (!num) {
                showRes('error', 'Bitte Vorgangsnummer eingeben!');
                return
            }
            try {
                const dateObj = dateFromHeader() || new Date();
                const dateStr = formatDate(dateObj);
                const rows = document.querySelectorAll('tbody tr');
                for (const row of rows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3 && cells[2].textContent.trim() === num) {
                        const timeTxt = cells[1]?.textContent || '';
                        const time = (timeTxt.match(/\b(\d{1,2}):(\d{2})\b/) || [])[0] || '00:00';
                        const hhmmss = `${time.padStart(5,'0')}:00`;
                        const datumUnix = Math.floor(new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime() / 1000);
                        const id = getIdParam();
                        const link = `https://zms20.verwalt-berlin.de/terminvereinbarung/admin/counter.php?id=${encodeURIComponent(id)}&Fehlermeldung=&Uhrzeit=${hhmmss}&Datum=${datumUnix}&Vorgangsnr=${encodeURIComponent(num)}&BuergeraufrufID=&Anmerkung=&Wartenummer=&ClusterID=`;
                        const text = buildTextFromUrl(link);
                        const richCopied = await copyTextRich(text.plain, text.html);
                        showRes(
    'success',
    null,
    `<div style="color: #2e8b49; font-size: 18px; font-weight: bold;">
        Termin wurde kopiert:<br><br>
        Datum: ${dateStr}<br>
        Uhrzeit: ${time} Uhr<br>
        Wartenummer: ${num}<br><br>
        ${richCopied ? '' : 'Nur Text kopiert.'}
    </div>`
);
                        return
                    }
                }
                showRes('error', `Der Termin mit der Vorgangsnummer "${num}" konnte nicht gefunden werden!`)
            } catch (e) {
                showRes('error', 'Fehler: ' + e.message)
            }
        }(function createWidget() {
            const w = el('div');
            w.id = 'zmsSearchWidget';
            w.style.cssText = `position:fixed;top:20px;right:20px;z-index:99999;background:#ffffff;color-scheme:light;border-radius:24px;padding:24px;width:380px;font-family:'Segoe UI',Arial,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,0.2),0 0 0 1px rgba(255,255,255,0.5) inset;transform:scale(0.9);opacity:0;animation:scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;`;
            w.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><b style="font-size:19px;background:#020b35ff;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Vorgangsnummer suchen</b><button id="closeBtn" style="background:#c5bebeff;border:1px solid #b00202ff;font-size:20px;width:32px;height:32px;border-radius:50%;cursor:pointer;color:white;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;line-height:1;">❌</button></div><input id="zmsNumberInput" type="text" placeholder="🔍 Vorgangsnummer eingeben..." style="width:100%;padding:14px 16px;font-size:15px;border-radius:12px;border:2px solid transparent;background:linear-gradient(white,white) padding-box,#23454aff border-box;outline:#03166cff;transition:all 0.3s ease;box-shadow:0 4px 15px rgba(0,0,0,0.08);color:#111;"><div style="display:flex;margin-top:16px;"><button id="searchBtn" style="flex:1;padding:14px;font-size:16px;font-weight:600;border:none;border-radius:12px;background:linear-gradient(270deg,rgba(8,49,99,1) 0%,rgba(7,129,217,1) 50%,rgba(8,49,99,1) 100%);color:white;cursor:pointer;box-shadow:0 8px 25px rgba(118,75,162,0.35);transition:all 0.3s cubic-bezier(0.25,0.46,0.45,0.94);position:relative;overflow:hidden;"><span style="position:relative;z-index:1;">Suchen & Kopieren</span></button></div><div id="zmsResult" style="display:none;margin-top:16px;"></div><style>#zmsSearchWidget{isolation:isolate;}#zmsSearchWidget #searchBtn{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;line-height:normal!important;white-space:normal!important;box-sizing:border-box!important;overflow:hidden!important;}#zmsSearchWidget #zmsNumberInput{box-sizing:border-box!important;outline:none!important;}#zmsSearchWidget,#zmsSearchWidget *{box-sizing:border-box!important;}#zmsSearchWidget #closeBtn{font-family:'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',system-ui,Arial,sans-serif!important;}#zmsSearchWidget,#zmsSearchWidget *,#zmsSearchWidget *::before,#zmsSearchWidget *::after{color-scheme:light!important;}@keyframes scaleIn{to{transform:scale(1);opacity:1;}}@keyframes fadeIn{to{transform:translateY(0);}}#searchBtn:hover{transform:translateY(-2px);box-shadow:0 12px 35px rgba(118,75,162,0.45);background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);}#searchBtn:active{transform:translateY(0);box-shadow:0 5px 15px rgba(118,75,162,0.4);}#closeBtn:hover{transform:rotate(90deg) scale(1.1);background:linear-gradient(135deg,#ff5252 0%,#ff1744 100%);box-shadow:0 3px 10px rgba(7,6,6,0.4);}#closeBtn:active{transform:rotate(90deg) scale(0.95);}#zmsNumberInput:focus{border-color:transparent;box-shadow:0 0 0 3px rgba(118,75,162,0.15),0 6px 20px rgba(118,75,162,0.2);transform:translateY(-1px);}#zmsSearchWidget{border:2px solid rgba(2,22,51,1);}#zmsSearchWidget::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;border-radius:24px;padding:2px;background:linear-gradient(135deg,#667eea,#764ba2,#f093fb,#f5576c);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0.3;pointer-events:none;}</style>`;
            document.body.appendChild(w);
            const input = document.getElementById('zmsNumberInput');
            requestAnimationFrame(() => input.focus());
            document.getElementById('closeBtn').onclick = () => {
                w.style.opacity = '0';
                w.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (w.parentNode) w.parentNode.removeChild(w)
                }, 200)
            };
            const btn = document.getElementById('searchBtn');
            btn.onclick = searchNum;
            input.onkeypress = e => {
                if (e.key === 'Enter') searchNum()
            }
        })()
    } catch (e) {
        alert('Fehler: ' + e.message)
    }
})();