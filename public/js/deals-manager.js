// deals-manager.js — deal lookup helpers used by both index.html and deals.html
window.DealsManager = (() => {
    'use strict';

    const API_BASE = 'http://localhost:5000/api/deals';
    const SAVED_KEY = 'dig_in_saved_deals';
    const REPORTED_KEY = 'dig_in_reported_deals';
    const MS_PER_DAY = 86400000;

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    function allDeals() {
        return window.DIG_IN_DEALS || [];
    }

    // ── Core filters ─────────────────────────────────────────────────────────

    function getActiveDeals() {
        const t = today();
        return allDeals().filter(d => !d.validUntil || d.validUntil >= t);
    }

    function getDealForStore(storeName) {
        const lower = (storeName || '').toLowerCase();
        return getActiveDeals().find(d => d.storeName.toLowerCase() === lower) || null;
    }

    function getAllDealsForStore(storeName) {
        const lower = (storeName || '').toLowerCase();
        return getActiveDeals().filter(d => d.storeName.toLowerCase() === lower);
    }

    function getDealsByType(type) {
        return getActiveDeals().filter(d => d.storeType === type);
    }

    function getDealsByCategory(category) {
        const lower = (category || '').toLowerCase();
        return getActiveDeals().filter(d => (d.category || '').toLowerCase() === lower);
    }

    function getDealsByBorough(borough) {
        const lower = (borough || '').toLowerCase();
        return getActiveDeals().filter(d =>
            d.borough === 'all' || (d.borough || '').toLowerCase() === lower
        );
    }

    function getDealsByState(state) {
        const lower = (state || '').toLowerCase();
        return getActiveDeals().filter(d => (d.state || '').toLowerCase() === lower);
    }

    function getDealsByRegion(region) {
        const lower = (region || '').toLowerCase();
        return getActiveDeals().filter(d =>
            (d.state || '').toLowerCase() === lower ||
            (d.borough || '').toLowerCase() === lower ||
            (d.region || '').toLowerCase() === lower
        );
    }

    // ── Expiration helpers ───────────────────────────────────────────────────

    function getExpiringDeals(withinDays) {
        const now = Date.now();
        const cutoff = withinDays * MS_PER_DAY;
        return getActiveDeals()
            .filter(d => {
                if (!d.validUntil) return false;
                const remaining = new Date(d.validUntil) - now;
                return remaining > 0 && remaining <= cutoff;
            })
            .sort((a, b) => new Date(a.validUntil) - new Date(b.validUntil));
    }

    function daysUntilExpiry(deal) {
        if (!deal || !deal.validUntil) return null;
        return Math.ceil((new Date(deal.validUntil) - new Date()) / MS_PER_DAY);
    }

    function isExpiringSoon(deal, threshold) {
        const days = daysUntilExpiry(deal);
        return days !== null && days > 0 && days <= (threshold || 3);
    }

    // ── Search & sort ────────────────────────────────────────────────────────

    function searchDeals(query) {
        const q = (query || '').toLowerCase().trim();
        if (!q) return getActiveDeals();
        return getActiveDeals().filter(d =>
            (d.storeName || '').toLowerCase().includes(q) ||
            (d.title || '').toLowerCase().includes(q) ||
            (d.description || '').toLowerCase().includes(q) ||
            (d.category || '').toLowerCase().includes(q) ||
            (d.discount || '').toLowerCase().includes(q)
        );
    }

    function sortDeals(deals, mode) {
        return [...deals].sort((a, b) => {
            if (mode === 'expiry') {
                const ad = a.validUntil ? new Date(a.validUntil) : new Date('2099-12-31');
                const bd = b.validUntil ? new Date(b.validUntil) : new Date('2099-12-31');
                return ad - bd;
            }
            if (mode === 'votes') return (b.votesUp || 0) - (a.votesUp || 0);
            if (mode === 'store') return (a.storeName || '').localeCompare(b.storeName || '');
            if (mode === 'category') return (a.category || '').localeCompare(b.category || '');
            return b.id > a.id ? 1 : -1;
        });
    }

    function getTopDeals(limit) {
        return getActiveDeals()
            .sort((a, b) => (b.votesUp || 0) - (a.votesUp || 0))
            .slice(0, limit || 10);
    }

    // ── Verified & chain ─────────────────────────────────────────────────────

    function getVerifiedDeals() {
        return getActiveDeals().filter(d => d.verified);
    }

    function getChainDeals() {
        return getActiveDeals().filter(d => d.chain);
    }

    function getCommunityDeals() {
        return getActiveDeals().filter(d => !d.chain);
    }

    // ── Saved deals (localStorage) ───────────────────────────────────────────

    function _loadSaved() {
        try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')); }
        catch { return new Set(); }
    }

    function _persistSaved(set) {
        try { localStorage.setItem(SAVED_KEY, JSON.stringify([...set])); }
        catch { /* storage full or unavailable */ }
    }

    function saveDeal(id) {
        const s = _loadSaved();
        s.add(id);
        _persistSaved(s);
    }

    function unsaveDeal(id) {
        const s = _loadSaved();
        s.delete(id);
        _persistSaved(s);
    }

    function toggleSavedDeal(id) {
        const s = _loadSaved();
        if (s.has(id)) s.delete(id); else s.add(id);
        _persistSaved(s);
        return s.has(id);
    }

    function isSaved(id) {
        return _loadSaved().has(id);
    }

    function getSavedDeals() {
        const ids = _loadSaved();
        return allDeals().filter(d => ids.has(d.id));
    }

    function getSavedCount() {
        return _loadSaved().size;
    }

    // ── Reporting ────────────────────────────────────────────────────────────

    function _loadReported() {
        try { return new Set(JSON.parse(localStorage.getItem(REPORTED_KEY) || '[]')); }
        catch { return new Set(); }
    }

    function isReported(id) {
        return _loadReported().has(id);
    }

    async function reportDeal(id, reason) {
        try {
            const res = await fetch(`${API_BASE}/${id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });
            if (!res.ok) throw new Error(await res.text());
        } catch { /* mark locally even if server is down */ }
        const s = _loadReported();
        s.add(id);
        try { localStorage.setItem(REPORTED_KEY, JSON.stringify([...s])); }
        catch { /* storage full */ }
    }

    // ── Grouping & aggregation ───────────────────────────────────────────────

    function groupByStore() {
        const map = {};
        getActiveDeals().forEach(d => {
            const key = d.storeName || 'Unknown';
            (map[key] = map[key] || []).push(d);
        });
        return map;
    }

    function groupByType() {
        const map = {};
        getActiveDeals().forEach(d => {
            const key = d.storeType || 'other';
            (map[key] = map[key] || []).push(d);
        });
        return map;
    }

    function groupByCategory() {
        const map = {};
        getActiveDeals().forEach(d => {
            const key = d.category || 'general';
            (map[key] = map[key] || []).push(d);
        });
        return map;
    }

    function comparePrices(category) {
        return getDealsByCategory(category)
            .sort((a, b) => (a.storeName || '').localeCompare(b.storeName || ''));
    }

    // ── Metadata ─────────────────────────────────────────────────────────────

    function getStoreTypes() {
        return [...new Set(allDeals().map(d => d.storeType).filter(Boolean))];
    }

    function getBoroughs() {
        return [...new Set(allDeals().map(d => d.borough).filter(b => b && b !== 'all'))];
    }

    function getCategories() {
        return [...new Set(allDeals().map(d => d.category).filter(Boolean))];
    }

    function getStores() {
        return [...new Set(allDeals().map(d => d.storeName).filter(Boolean))].sort();
    }

    function getDealCount() {
        return getActiveDeals().length;
    }

    function getDealStats() {
        const active = getActiveDeals();
        const byType = {};
        const byCategory = {};
        const byBorough = {};
        let expiringSoon = 0;
        let verified = 0;
        let chain = 0;

        active.forEach(d => {
            byType[d.storeType || 'other'] = (byType[d.storeType || 'other'] || 0) + 1;
            byCategory[d.category || 'general'] = (byCategory[d.category || 'general'] || 0) + 1;
            if (d.borough && d.borough !== 'all') {
                byBorough[d.borough] = (byBorough[d.borough] || 0) + 1;
            }
            if (isExpiringSoon(d, 7)) expiringSoon++;
            if (d.verified) verified++;
            if (d.chain) chain++;
        });

        return {
            total: active.length,
            byType,
            byCategory,
            byBorough,
            expiringSoon,
            verified,
            chain,
            community: active.length - chain,
            saved: getSavedCount(),
        };
    }

    // ── Fast lookup set ──────────────────────────────────────────────────────

    function buildDealSet() {
        const s = new Set();
        getActiveDeals().forEach(d => s.add(d.storeName.toLowerCase()));
        return s;
    }

    // ── Export ────────────────────────────────────────────────────────────────

    function exportDeals(format) {
        const deals = getActiveDeals();
        if (format === 'csv') {
            const headers = ['id','storeName','storeType','borough','title','description','discount','category','validUntil'];
            const escape = v => '"' + String(v || '').replace(/"/g, '""') + '"';
            const rows = deals.map(d => headers.map(h => escape(d[h])).join(','));
            return headers.join(',') + '\n' + rows.join('\n');
        }
        return JSON.stringify(deals, null, 2);
    }

    // ── Multi-filter ─────────────────────────────────────────────────────────

    function filterDeals(opts) {
        let deals = getActiveDeals();
        if (opts.type && opts.type !== 'all') {
            deals = deals.filter(d => d.storeType === opts.type);
        }
        if (opts.borough && opts.borough !== 'all') {
            deals = deals.filter(d => d.borough === 'all' || d.borough === opts.borough);
        }
        if (opts.state) {
            deals = deals.filter(d => (d.state || '').toLowerCase() === opts.state.toLowerCase());
        }
        if (opts.category) {
            deals = deals.filter(d => (d.category || '').toLowerCase() === opts.category.toLowerCase());
        }
        if (opts.chain === true)  deals = deals.filter(d => d.chain);
        if (opts.chain === false) deals = deals.filter(d => !d.chain);
        if (opts.verified)        deals = deals.filter(d => d.verified);
        if (opts.savedOnly)       { const ids = _loadSaved(); deals = deals.filter(d => ids.has(d.id)); }
        if (opts.query) {
            const q = opts.query.toLowerCase();
            deals = deals.filter(d =>
                (d.storeName || '').toLowerCase().includes(q) ||
                (d.title || '').toLowerCase().includes(q) ||
                (d.description || '').toLowerCase().includes(q)
            );
        }
        if (opts.expiringWithin) {
            const now = Date.now();
            const cutoff = opts.expiringWithin * MS_PER_DAY;
            deals = deals.filter(d => {
                if (!d.validUntil) return false;
                const remaining = new Date(d.validUntil) - now;
                return remaining > 0 && remaining <= cutoff;
            });
        }
        if (opts.sort) deals = sortDeals(deals, opts.sort);
        if (opts.limit) deals = deals.slice(0, opts.limit);
        return deals;
    }

    // ── Server sync ──────────────────────────────────────────────────────────

    async function syncFromServer() {
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) return;
            const { deals } = await res.json();
            if (!Array.isArray(deals)) return;
            const localById = new Map((window.DIG_IN_DEALS || []).map(d => [d.id, d]));
            deals.forEach(d => localById.set(d.id, d));
            window.DIG_IN_DEALS = [...localById.values()];
        } catch {
            // Backend offline -- local data still works
        }
    }

    async function submitDeal(payload) {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        const deal = await res.json();
        (window.DIG_IN_DEALS = window.DIG_IN_DEALS || []).push(deal);
        return deal;
    }

    async function voteDeal(id, vote) {
        const res = await fetch(`${API_BASE}/${id}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    }

    async function fetchLiveDeals() {
        try {
            const res = await fetch('http://localhost:5000/api/live-deals');
            if (!res.ok) return null;
            const data = await res.json();
            if (!Array.isArray(data.deals)) return null;
            window.DIG_IN_DEALS = [
                ...(window.DIG_IN_DEALS || []).filter(d => d.source !== 'live'),
                ...data.deals,
            ];
            return data;
        } catch {
            return null;
        }
    }

    return {
        getActiveDeals,
        getDealForStore,
        getAllDealsForStore,
        getDealsByType,
        getDealsByCategory,
        getDealsByBorough,
        getDealsByState,
        getDealsByRegion,
        getExpiringDeals,
        daysUntilExpiry,
        isExpiringSoon,
        searchDeals,
        sortDeals,
        getTopDeals,
        getVerifiedDeals,
        getChainDeals,
        getCommunityDeals,
        saveDeal,
        unsaveDeal,
        toggleSavedDeal,
        isSaved,
        getSavedDeals,
        getSavedCount,
        reportDeal,
        isReported,
        groupByStore,
        groupByType,
        groupByCategory,
        comparePrices,
        getStoreTypes,
        getBoroughs,
        getCategories,
        getStores,
        getDealCount,
        getDealStats,
        buildDealSet,
        exportDeals,
        filterDeals,
        syncFromServer,
        submitDeal,
        voteDeal,
        fetchLiveDeals,
    };
})();
