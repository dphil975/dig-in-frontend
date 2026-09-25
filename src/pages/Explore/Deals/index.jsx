import { useEffect } from 'react';
import Nav from '../../../components/shell/Nav';
import { loadScriptOnce } from '../../../utils/loadScript';
import './Deals.css';

export default function Deals({ embedded = false } = {}) {
  // Load the legacy deals scripts once. They define globals (DealsManager,
  // DIG_IN_DEALS, PixelAd, DinoAd); loadScriptOnce keeps them from executing
  // twice (StrictMode / re-navigation) which would throw "already declared".
  useEffect(() => {
    loadScriptOnce('/deals-data.js');
    loadScriptOnce('/js/deals-manager.js');
    loadScriptOnce('/js/pixel-ad.js');
    loadScriptOnce('/js/dino-ad.js');
  }, []);

  // Main deals page logic (inline script converted to useEffect)
  useEffect(() => {
    // Wait for DealsManager to be available
    const init = () => {
      if (!window.DealsManager) {
        setTimeout(init, 100);
        return;
      }
      runDealsLogic();
    };
    init();

    function runDealsLogic() {
      'use strict';

      const ALL_TYPES = ['pharmacy','chain','market','grocery','corner','bodega'];
      const TYPE_LABELS = {
        bodega:'Bodega', corner:'Corner Store', grocery:'Grocery',
        pharmacy:'Pharmacy', chain:'Chain Store', market:'Specialty Market',
      };

      let activeType    = 'all';
      let activeBorough = 'all';
      let sortMode      = 'expiry';
      let searchQuery   = '';
      let savedDeals    = new Set(JSON.parse(localStorage.getItem('dig_in_saved_deals') || '[]'));
      let refreshTimer  = null;
      let lastRefreshAt = null;

      function today() { return new Date().toISOString().slice(0, 10); }

      function daysLeft(validUntil) {
        if (!validUntil) return null;
        const d = Math.ceil((new Date(validUntil) - new Date()) / 86400000);
        if (d <= 0) return null;
        if (d === 1) return { label:'Last day!', cls:'urgent' };
        if (d <= 3) return { label:`${d} days left`, cls:'urgent' };
        if (d <= 7) return { label:`${d} days left`, cls:'soon' };
        return { label:`Until ${validUntil}`, cls:'normal' };
      }

      function sortDeals(arr) {
        return [...arr].sort((a, b) => {
          if (sortMode === 'expiry') {
            const ad = a.validUntil ? new Date(a.validUntil) : new Date('2099-12-31');
            const bd = b.validUntil ? new Date(b.validUntil) : new Date('2099-12-31');
            return ad - bd;
          }
          if (sortMode === 'votes') return (b.votesUp || 0) - (a.votesUp || 0);
          return b.id > a.id ? 1 : -1;
        });
      }

      function filteredDeals(type) {
        const t = today();
        const q = searchQuery.toLowerCase();
        return sortDeals(
          (window.DIG_IN_DEALS || []).filter(d => {
            if (d.validUntil && d.validUntil < t) return false;
            if (activeType !== 'all' && d.storeType !== activeType) return false;
            if (activeType !== 'all' && type !== activeType) return false;
            if (d.storeType !== type) return false;
            if (activeBorough !== 'all' && d.borough !== activeBorough && d.borough !== 'all') return false;
            if (q && !d.storeName.toLowerCase().includes(q) &&
                     !d.title.toLowerCase().includes(q) &&
                     !(d.description || '').toLowerCase().includes(q)) return false;
            return true;
          })
        );
      }

      function gridCardHTML(d) {
        const dl   = daysLeft(d.validUntil);
        const expHTML = dl ? `<span class="deal-urgency ${dl.cls}">${dl.label}</span>` : '';
        const verHTML = d.verified ? `<span class="deal-verified-badge">Verified</span>` : '';
        const isSaved = savedDeals.has(d.id);
        const emojiHTML = d.emoji ? `<span class="deal-chain-emoji">${d.emoji}</span>` : '';
        return `<div class="deal-card" data-id="${d.id}">
            <div class="deal-card-stripe ${d.storeType}"></div>
            <div class="deal-card-compact">
                <div class="deal-store-row">
                    ${emojiHTML}
                    <span class="deal-store-type-tag ${d.storeType}">${TYPE_LABELS[d.storeType] || d.storeType}</span>
                </div>
                <div class="deal-store-name">${d.storeName}</div>
                <div class="deal-title">${d.title}</div>
                ${d.discount ? `<span class="deal-discount-badge">${d.discount}</span>` : ''}
            </div>
            <div class="deal-card-expand">
                ${d.description ? `<div class="deal-desc">${d.description}</div>` : ''}
                <div class="deal-meta">${expHTML}${verHTML}</div>
                ${d.storeName ? `<button class="btn-deal-map" data-store="${d.storeName}">&#8599; View on Map</button>` : ''}
            </div>
            <button class="deal-card-plus${isSaved ? ' saved' : ''}" data-id="${d.id}" title="${isSaved ? 'Saved — click to remove' : 'Save deal'}">${isSaved ? '✓' : '+'}</button>
        </div>`;
      }

      function render() {
        let total = 0;
        ALL_TYPES.forEach(t => {
          const bucket = filteredDeals(t);
          const grid   = document.getElementById(`grid-${t}`);
          const count  = document.getElementById(`count-${t}`);
          const sect   = document.getElementById(`section-${t}`);
          if (!grid) return;
          total += bucket.length;
          grid.innerHTML = bucket.length
            ? bucket.map(gridCardHTML).join('')
            : `<div class="deal-empty">No ${TYPE_LABELS[t] || t} deals match your filters.</div>`;
          if (count) count.textContent = `${bucket.length} deal${bucket.length !== 1 ? 's' : ''}`;
          if (sect) sect.hidden = activeType !== 'all' && activeType !== t;
        });
        const heroCount = document.getElementById('heroDealsCount');
        if (heroCount) heroCount.textContent = `${total} active deal${total !== 1 ? 's' : ''}`;
      }

      function carouselCardHTML(d) {
        const dl = daysLeft(d.validUntil);
        const urgBadge = dl && (dl.cls === 'urgent' || dl.cls === 'soon')
          ? `<span class="lc-urgent-badge">${dl.label}</span>` : '';
        const expLine = dl ? `<div class="lc-expiry ${dl.cls}">${dl.label}</div>` : '';
        const isSaved = savedDeals.has(d.id);
        return `<div class="lc" data-id="${d.id}" data-store="${d.storeName || ''}">
            <div class="lc-stripe ${d.storeType}"></div>
            <div class="lc-head">
                <div class="lc-store-row">
                    <span class="lc-emoji">${d.emoji || 'DEAL'}</span>
                    <span class="lc-store-name">${d.storeName}</span>
                </div>
                <div class="lc-title">${d.title}</div>
                <span class="lc-badge">${d.discount || ''}</span>${urgBadge}
            </div>
            <div class="lc-body">
                <div class="lc-desc">${d.description || ''}</div>
                ${expLine}
                <div class="lc-actions">
                    <button class="lc-map-btn" data-store="${d.storeName || ''}">&#8599; Map</button>
                </div>
            </div>
            <button class="lc-plus${isSaved ? ' saved' : ''}" data-id="${d.id}" title="${isSaved ? 'Saved' : 'Save deal'}">${isSaved ? '✓' : '+'}</button>
        </div>`;
      }

      function renderCarousel(deals) {
        const scroll = document.getElementById('liveScroll');
        if (!scroll) return;
        if (!deals || !deals.length) {
          scroll.innerHTML = '<div style="color:#666;font-size:12px;padding:20px">No live deals available — will retry shortly.</div>';
          return;
        }
        scroll.innerHTML = deals.map(carouselCardHTML).join('');
      }

      function setLiveStatus(text, stale = false) {
        const dot  = document.getElementById('liveDot');
        const span = document.getElementById('liveStatusText');
        if (dot)  dot.className  = 'live-dot' + (stale ? ' stale' : '');
        if (span) span.textContent = text;
      }

      async function fetchLive() {
        setLiveStatus('Scanning for deals…');
        const data = await window.DealsManager.fetchLiveDeals();
        if (data && data.deals) {
          lastRefreshAt = Date.now();
          renderCarousel(data.deals);
          render();
          setLiveStatus('Updated just now');
          startCountdown(data.nextRefreshAt);
        } else {
          const chainFallback = (window.DIG_IN_DEALS || []).filter(d => d.chain);
          renderCarousel(chainFallback);
          setLiveStatus('Offline — using saved data', true);
        }
      }

      function startCountdown(nextRefreshAtISO) {
        clearInterval(refreshTimer);
        const nextRefreshAt = new Date(nextRefreshAtISO).getTime();
        refreshTimer = setInterval(() => {
          const remaining = Math.max(0, nextRefreshAt - Date.now());
          if (remaining <= 0) {
            clearInterval(refreshTimer);
            fetchLive();
          } else {
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            const ago  = lastRefreshAt
              ? `${Math.floor((Date.now() - lastRefreshAt) / 60000)}m ago`
              : '';
            setLiveStatus(`Updated ${ago} · refreshing in ${mins}:${secs.toString().padStart(2,'0')}`);
          }
        }, 1000);
      }

      function showToast(msg) {
        const t = document.getElementById('savedToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2200);
      }

      function toggleSave(id, btnEl) {
        if (savedDeals.has(id)) {
          savedDeals.delete(id);
          btnEl.classList.remove('saved');
          btnEl.textContent = '+';
          btnEl.title = 'Save deal';
          showToast('Deal removed from saved');
        } else {
          savedDeals.add(id);
          btnEl.classList.add('saved');
          btnEl.textContent = '✓';
          btnEl.title = 'Saved — click to remove';
          showToast('Deal saved!');
        }
        localStorage.setItem('dig_in_saved_deals', JSON.stringify([...savedDeals]));
      }

      // Global click delegation
      document.addEventListener('click', handleGlobalClick);
      function handleGlobalClick(e) {
        const plusEl = e.target.closest('.deal-card-plus, .lc-plus');
        const mapBtn = e.target.closest('.btn-deal-map, .lc-map-btn');
        const card   = e.target.closest('.deal-card, .lc');

        if (plusEl) {
          e.stopPropagation();
          toggleSave(plusEl.dataset.id, plusEl);
          renderSavedSection();
          return;
        }
        if (mapBtn) {
          e.stopPropagation();
          const name = encodeURIComponent(mapBtn.dataset.store || '');
          window.location.href = `/#deal-store:${name}`;
          return;
        }
        if (card && !mapBtn && !plusEl) {
          card.classList.toggle('expanded');
        }
      }

      // Filter buttons
      document.getElementById('typeFilters')?.addEventListener('click', e => {
        const btn = e.target.closest('.dfbtn[data-type]');
        if (!btn) return;
        activeType = btn.dataset.type;
        document.querySelectorAll('#typeFilters .dfbtn').forEach(b => b.classList.toggle('active', b === btn));
        render();
      });
      document.getElementById('boroughFilters')?.addEventListener('click', e => {
        const btn = e.target.closest('.dfbtn[data-borough]');
        if (!btn) return;
        activeBorough = btn.dataset.borough;
        document.querySelectorAll('#boroughFilters .dfbtn').forEach(b => b.classList.toggle('active', b === btn));
        render();
      });
      document.getElementById('dealSort')?.addEventListener('change', e => {
        sortMode = e.target.value;
        render();
      });
      document.getElementById('dealsSearch')?.addEventListener('input', e => {
        searchQuery = e.target.value;
        render();
      });
      document.getElementById('btnManualRefresh')?.addEventListener('click', () => {
        clearInterval(refreshTimer);
        fetchLive();
      });

      // Submit modal
      const overlay  = document.getElementById('deal-modal-overlay');
      const statusEl = document.getElementById('dealModalStatus');
      document.getElementById('btnOpenSubmit')?.addEventListener('click', () => overlay?.classList.add('open'));
      document.getElementById('btnCancelModal')?.addEventListener('click', () => overlay?.classList.remove('open'));
      overlay?.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

      document.getElementById('btnSubmitDeal')?.addEventListener('click', async () => {
        const storeName = document.getElementById('dm-store')?.value.trim();
        const title     = document.getElementById('dm-title')?.value.trim();
        if (!storeName || !title) {
          if (statusEl) { statusEl.textContent = 'Store name and title are required.'; statusEl.style.color = '#c85000'; }
          return;
        }
        const payload = {
          storeName,
          storeType:   document.getElementById('dm-type')?.value,
          borough:     document.getElementById('dm-borough')?.value,
          title,
          description: document.getElementById('dm-desc')?.value.trim(),
          discount:    document.getElementById('dm-discount')?.value.trim(),
          validUntil:  document.getElementById('dm-valid')?.value || null,
        };
        if (statusEl) { statusEl.textContent = 'Submitting…'; statusEl.style.color = '#888'; }
        try {
          await window.DealsManager.submitDeal(payload);
          overlay?.classList.remove('open');
          render();
        } catch {
          (window.DIG_IN_DEALS = window.DIG_IN_DEALS || []).push({
            ...payload, id: 'local_' + Date.now(), votesUp: 0, verified: false,
          });
          render();
          if (statusEl) statusEl.textContent = 'Saved locally — syncs when connected.';
          setTimeout(() => overlay?.classList.remove('open'), 1400);
        }
      });

      // Saved deals section
      function savedCardHTML(d) {
        const emoji = d.emoji || 'DEAL';
        return `<div class="saved-card">
            <div class="saved-card-stripe ${d.storeType}"></div>
            <div class="saved-card-body">
                <div class="saved-card-store-row">
                    <span class="saved-card-emoji">${emoji}</span>
                    <span class="saved-card-store">${d.storeName}</span>
                </div>
                <div class="saved-card-badge">${d.discount || ''}</div>
                <div class="saved-card-title">${d.title}</div>
            </div>
            <button class="saved-card-remove" data-id="${d.id}" title="Remove">✕</button>
        </div>`;
      }

      function renderSavedSection() {
        const section = document.getElementById('savedSection');
        const wrap    = document.getElementById('savedCardsWrap');
        const countEl = document.getElementById('savedCount');
        if (!section || !wrap) return;

        const all = (window.DIG_IN_DEALS || []);
        const cards = [...savedDeals]
          .map(id => all.find(d => d.id === id))
          .filter(Boolean);

        section.hidden = cards.length === 0;
        if (countEl) countEl.textContent = `${cards.length} saved`;

        if (!cards.length) {
          wrap.innerHTML = '<span class="saved-empty">No saved deals yet — tap + on any deal to save it.</span>';
          return;
        }
        wrap.innerHTML = cards.map(savedCardHTML).join('');
        wrap.querySelectorAll('.saved-card-remove').forEach(btn => {
          btn.addEventListener('click', e => {
            e.stopPropagation();
            savedDeals.delete(btn.dataset.id);
            localStorage.setItem('dig_in_saved_deals', JSON.stringify([...savedDeals]));
            document.querySelectorAll(`.deal-card-plus[data-id="${btn.dataset.id}"], .lc-plus[data-id="${btn.dataset.id}"], #spotlightSaveBtn[data-id="${btn.dataset.id}"]`).forEach(b => {
              b.classList.remove('saved');
              b.textContent = '+';
              b.title = 'Save deal';
            });
            showToast('Deal removed from saved');
            renderSavedSection();
          });
        });
      }

      // Deal spotlight modal
      const spotlightOverlay = document.getElementById('deal-spotlight-overlay');

      function openSpotlight(dealId) {
        const deal = (window.DIG_IN_DEALS || []).find(d => d.id === dealId);
        if (!deal) return false;
        const dl = daysLeft(deal.validUntil);
        const isSaved = savedDeals.has(deal.id);

        document.getElementById('spotlightEmoji').textContent    = deal.emoji || 'DEAL';
        document.getElementById('spotlightStore').textContent     = deal.storeName;
        document.getElementById('spotlightTitle').textContent     = deal.title;
        document.getElementById('spotlightDiscount').textContent  = deal.discount || '';
        document.getElementById('spotlightDesc').textContent      = deal.description || '';

        const expEl = document.getElementById('spotlightExpiry');
        if (dl) { expEl.textContent = dl.label; expEl.className = `spotlight-expiry ${dl.cls}`; }
        else    { expEl.textContent = ''; }

        const typeTag = document.getElementById('spotlightTypeTag');
        typeTag.textContent  = TYPE_LABELS[deal.storeType] || deal.storeType;
        typeTag.className    = `spotlight-type-tag ${deal.storeType}`;

        document.getElementById('spotlightStripe').className = `spotlight-stripe ${deal.storeType}`;

        const saveBtn = document.getElementById('spotlightSaveBtn');
        saveBtn.dataset.id   = deal.id;
        saveBtn.className    = `spotlight-save-btn${isSaved ? ' saved' : ''}`;
        saveBtn.textContent  = isSaved ? '✓ Saved' : '+ Save Deal';

        const mapBtn = document.getElementById('spotlightMapBtn');
        mapBtn.dataset.store = deal.storeName;

        spotlightOverlay.classList.add('open');
        return true;
      }

      function closeSpotlight() {
        spotlightOverlay?.classList.remove('open');
      }

      document.getElementById('spotlightClose')?.addEventListener('click', closeSpotlight);
      spotlightOverlay?.addEventListener('click', e => {
        if (e.target === spotlightOverlay) closeSpotlight();
      });
      document.getElementById('spotlightMapBtn')?.addEventListener('click', e => {
        const name = encodeURIComponent(e.currentTarget.dataset.store || '');
        window.location.href = `/#deal-store:${name}`;
      });
      document.getElementById('spotlightSaveBtn')?.addEventListener('click', e => {
        const btn = e.currentTarget;
        toggleSave(btn.dataset.id, btn);
        renderSavedSection();
        btn.className   = `spotlight-save-btn${savedDeals.has(btn.dataset.id) ? ' saved' : ''}`;
        btn.textContent = savedDeals.has(btn.dataset.id) ? '✓ Saved' : '+ Save Deal';
      });

      // Ticker
      (function buildTicker() {
        const stores = [
          'CVS Pharmacy','Walgreens','Target','Whole Foods','Trader Joe\'s',
          'Aldi','Key Food','Duane Reade','Stop & Shop','Dollar General',
          'Rite Aid','Associated','Park Slope Provisions','Patel Bros',
          'Sunrise Bodega','Flatbush Corner','Bedford Bodega','Harlem Fresh',
        ];
        const text = stores.map(s =>
          `<span class="ticker-item">${s}</span><span class="ticker-sep">·</span>`
        ).join('');
        const track = document.getElementById('tickerTrack');
        if (track) track.innerHTML = text + text;
      })();

      // Coin display
      const coinEl = document.getElementById('coinCount');
      if (coinEl) coinEl.textContent = localStorage.getItem('dig_in_coins') || '0';

      // Boot
      render();
      renderSavedSection();
      window.DealsManager.syncFromServer().then(() => { render(); renderSavedSection(); });
      fetchLive().then(() => renderSavedSection());

      // Auto-open spotlight from URL
      const openId = new URLSearchParams(location.search).get('open');
      if (openId) {
        if (!openSpotlight(openId)) {
          setTimeout(() => openSpotlight(openId), 1800);
        }
      }

      // Pixel ad slot
      (function initAdSlot() {
        const btn   = document.getElementById('btnWatchAd');
        const mount = document.getElementById('pixelAdMount');
        let   activeAd = null;

        function launchAd() {
          if (activeAd) activeAd.destroy();
          mount.innerHTML = '';
          btn.disabled    = true;
          btn.textContent = 'Playing…';
          activeAd = window.PixelAd.mount(mount, { reward: 50 });
          document.addEventListener('pixeladCompleted', onAdDone, { once: true });
          document.addEventListener('pixeladSkipped',   onAdSkip, { once: true });
        }

        function onAdDone(e) {
          btn.textContent = `✓ Earned +${e.detail.reward}`;
          btn.style.background = '#7ae0b0';
          btn.style.borderColor = '#1a7045';
          setTimeout(resetBtn, 30000);
        }

        function onAdSkip() {
          btn.disabled    = false;
          btn.textContent = 'Watch for +50';
          btn.style.background = '';
          btn.style.borderColor = '';
        }

        function resetBtn() {
          btn.disabled    = false;
          btn.textContent = 'Watch for +50';
          btn.style.background = '';
          btn.style.borderColor = '';
          mount.innerHTML = '';
          activeAd = null;
        }

        btn?.addEventListener('click', launchAd);
      })();

      // Dino game ad slot
      (function initDinoSlot() {
        const btn   = document.getElementById('btnPlayDino');
        const mount = document.getElementById('dinoAdMount');
        let   activeGame = null;

        function launchGame() {
          if (activeGame) activeGame.destroy();
          mount.innerHTML = '';
          btn.disabled    = true;
          btn.textContent = 'Playing…';
          activeGame = window.DinoAd.mount(mount, { reward: 50 });
          document.addEventListener('dinoadGameOver', onGameOver, { once: true });
          document.addEventListener('dinoadSkipped',  onSkipped,  { once: true });
        }

        function onGameOver(e) {
          btn.textContent        = `✓ Earned +${e.detail.coins}`;
          btn.style.background   = '#7ae0b0';
          btn.style.borderBottom = '3px solid #1a7045';
          btn.style.color        = '#33302A';
          setTimeout(resetBtn, 30000);
        }

        function onSkipped() { resetBtn(); }

        function resetBtn() {
          btn.disabled           = false;
          btn.textContent        = 'Play for +50';
          btn.style.background   = '';
          btn.style.borderBottom = '';
          btn.style.color        = '';
          mount.innerHTML        = '';
          activeGame             = null;
        }

        btn?.addEventListener('click', launchGame);
      })();

      return () => {
        document.removeEventListener('click', handleGlobalClick);
        clearInterval(refreshTimer);
      };
    }
  }, []);

  return (
    <>
      {!embedded && <Nav />}

      {/* Hero banner */}
      <div className="game-header" style={{ position: 'relative' }}>
        <div className="title-screen">
          <a href="/" className="title-link"><h1>DIG-IN</h1></a>
        </div>
        <p className="tagline">NYC DEALS &amp; PRICES</p>
        <div className="deals-hero-row" style={{ marginTop: '12px' }}>
          <div className="deals-hero-count" id="heroDealsCount">Loading…</div>
          <div className="live-status-badge">
            <div className="live-dot" id="liveDot"></div>
            <span id="liveStatusText">Checking for deals…</span>
          </div>
        </div>
      </div>

      {/* Moving ticker */}
      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-track" id="tickerTrack"></div>
      </div>

      {/* Filter bar */}
      <div className="deals-filter-bar">
        <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }} id="typeFilters">
          <button className="dfbtn active"    data-type="all">All</button>
          <button className="dfbtn bodega"    data-type="bodega">Bodega</button>
          <button className="dfbtn corner"    data-type="corner">Corner</button>
          <button className="dfbtn grocery"   data-type="grocery">Grocery</button>
          <button className="dfbtn pharmacy"  data-type="pharmacy">Pharmacy</button>
          <button className="dfbtn chain"     data-type="chain">Chains</button>
          <button className="dfbtn market"    data-type="market">Markets</button>
        </div>
        <div className="filter-sep"></div>
        <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }} id="boroughFilters">
          <button className="dfbtn active" data-borough="all">All NYC</button>
          <button className="dfbtn" data-borough="manhattan">Manhattan</button>
          <button className="dfbtn" data-borough="brooklyn">Brooklyn</button>
          <button className="dfbtn" data-borough="queens">Queens</button>
          <button className="dfbtn" data-borough="bronx">Bronx</button>
          <button className="dfbtn" data-borough="staten-island">S.I.</button>
        </div>
        <div className="filter-sep"></div>
        <select className="sort-select" id="dealSort">
          <option value="expiry">Expiring Soon</option>
          <option value="newest">Newest</option>
          <option value="votes">Most Voted</option>
        </select>
        <input id="dealsSearch" type="text" placeholder="Search deals…" className="deals-search-input" />
      </div>

      {/* Live deals carousel */}
      <div className="live-section" id="liveSection">
        <div className="live-section-header">
          <span className="live-section-title">LIVE CHAIN DEALS</span>
          <button className="live-refresh-btn" id="btnManualRefresh">↺ Refresh</button>
        </div>
        <div className="live-scroll" id="liveScroll">
          <div className="lc-skeleton"></div>
          <div className="lc-skeleton"></div>
          <div className="lc-skeleton"></div>
          <div className="lc-skeleton"></div>
        </div>
      </div>

      {/* Pixel ad slot */}
      <div className="pixel-ad-section" id="pixelAdSection">
        <div className="pixel-ad-section-header">
          <span className="pixel-ad-section-label">SPONSORED · EARN COINS</span>
          <button className="pixel-ad-earn-btn" id="btnWatchAd">Watch for +50</button>
        </div>
        <div className="pixel-ad-mount" id="pixelAdMount"></div>
      </div>

      {/* Dino ad slot */}
      <div className="dino-ad-section" id="dinoAdSection">
        <div className="dino-ad-section-header">
          <span className="dino-ad-section-label">PLAY &amp; EARN COINS</span>
          <button className="dino-ad-launch-btn" id="btnPlayDino">Play for +50</button>
        </div>
        <p className="dino-ad-hint">Jump over obstacles — earn coins based on your score</p>
        <div className="dino-ad-mount-area" id="dinoAdMount"></div>
      </div>

      {/* Saved deals */}
      <div className="saved-section" id="savedSection" hidden>
        <div className="saved-section-header">
          <span className="saved-section-title">SAVED DEALS</span>
          <span className="saved-section-count" id="savedCount"></span>
        </div>
        <div className="saved-cards-wrap" id="savedCardsWrap"></div>
      </div>

      {/* Deal spotlight modal */}
      <div id="deal-spotlight-overlay">
        <div className="deal-spotlight" id="dealSpotlight">
          <button className="spotlight-close" id="spotlightClose">✕</button>
          <div className="spotlight-stripe" id="spotlightStripe"></div>
          <div className="spotlight-body">
            <div className="spotlight-store-row">
              <span className="spotlight-emoji" id="spotlightEmoji"></span>
              <div className="spotlight-store-info">
                <div className="spotlight-store-name" id="spotlightStore"></div>
                <span className="spotlight-type-tag" id="spotlightTypeTag"></span>
              </div>
            </div>
            <div className="spotlight-title" id="spotlightTitle"></div>
            <div className="spotlight-discount" id="spotlightDiscount"></div>
            <div className="spotlight-desc" id="spotlightDesc"></div>
            <div className="spotlight-expiry" id="spotlightExpiry"></div>
            <div className="spotlight-actions">
              <button className="spotlight-map-btn" id="spotlightMapBtn">&#8599; Find on Map</button>
              <button className="spotlight-save-btn" id="spotlightSaveBtn">+ Save Deal</button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit CTA */}
      <div className="deals-submit-bar">
        <p>Know about a local deal?<br />Share it with your community.</p>
        <button className="btn-submit-deal" id="btnOpenSubmit">+ Submit a Deal</button>
      </div>

      {/* Community deal sections */}
      <div className="deals-page-body" id="dealsPageBody">
        {['pharmacy','chain','market','grocery','corner','bodega'].map(type => {
          const TITLES = {
            pharmacy: 'PHARMACIES', chain: 'CHAIN STORES', market: 'SPECIALTY MARKETS',
            grocery: 'GROCERY STORES', corner: 'CORNER STORES', bodega: 'BODEGAS',
          };
          return (
            <div className="deals-section" id={`section-${type}`} key={type}>
              <div className="deals-section-header">
                <div className="deals-section-swatch" style={{ background: `var(--c-${type})` }}></div>
                <span className="deals-section-title">{TITLES[type]}</span>
                <span className="deals-section-count" id={`count-${type}`}></span>
                <span className="deals-section-expiry-note">↑ soonest expiring</span>
              </div>
              <div className="deals-grid" id={`grid-${type}`}></div>
            </div>
          );
        })}
      </div>

      {/* Submit modal */}
      <div id="deal-modal-overlay">
        <div className="deal-modal">
          <h3>Submit a Deal</h3>
          <div className="deal-modal-row">
            <label htmlFor="dm-store" className="deal-modal-label">Store Name</label>
            <input id="dm-store" type="text" className="deal-modal-input" placeholder="e.g. Sunrise Bodega" />
          </div>
          <div className="deal-modal-row-2">
            <div className="deal-modal-row">
              <label htmlFor="dm-type" className="deal-modal-label">Store Type</label>
              <select id="dm-type" className="deal-modal-select">
                <option value="bodega">Bodega</option>
                <option value="corner">Corner Store</option>
                <option value="grocery">Grocery</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="chain">Chain Store</option>
                <option value="market">Specialty Market</option>
              </select>
            </div>
            <div className="deal-modal-row">
              <label htmlFor="dm-borough" className="deal-modal-label">Borough</label>
              <select id="dm-borough" className="deal-modal-select">
                <option value="manhattan">Manhattan</option>
                <option value="brooklyn">Brooklyn</option>
                <option value="queens">Queens</option>
                <option value="bronx">Bronx</option>
                <option value="staten-island">Staten Island</option>
                <option value="all">All Boroughs</option>
              </select>
            </div>
          </div>
          <div className="deal-modal-row">
            <label htmlFor="dm-title" className="deal-modal-label">Deal Title</label>
            <input id="dm-title" type="text" className="deal-modal-input" placeholder="e.g. Coffee + Roll $2.50" />
          </div>
          <div className="deal-modal-row">
            <label htmlFor="dm-desc" className="deal-modal-label">Description</label>
            <textarea id="dm-desc" className="deal-modal-textarea" placeholder="What's included, any conditions..."></textarea>
          </div>
          <div className="deal-modal-row-2">
            <div className="deal-modal-row">
              <label htmlFor="dm-discount" className="deal-modal-label">Discount</label>
              <input id="dm-discount" type="text" className="deal-modal-input" placeholder="e.g. Save $2" />
            </div>
            <div className="deal-modal-row">
              <label htmlFor="dm-valid" className="deal-modal-label">Valid Until</label>
              <input id="dm-valid" type="date" className="deal-modal-input" />
            </div>
          </div>
          <div className="deal-modal-actions">
            <button className="btn-modal-submit" id="btnSubmitDeal">Submit Deal</button>
            <button className="btn-modal-cancel" id="btnCancelModal">Cancel</button>
          </div>
          <div className="deal-modal-status" id="dealModalStatus"></div>
        </div>
      </div>

      {/* Toast */}
      <div className="saved-toast" id="savedToast"></div>
    </>
  );
}
