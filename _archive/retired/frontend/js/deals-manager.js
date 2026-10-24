// deals-manager.js — deal lookup helpers used by both index.html and deals.html
window.DealsManager = (() => {
    'use strict';

    const API_BASE = 'http://localhost:5000/api/deals';

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    // Returns all deals that haven't expired yet
    function getActiveDeals() {
        const t = today();
        return (window.DIG_IN_DEALS || []).filter(d => !d.validUntil || d.validUntil >= t);
    }

    // Returns the first active deal matching a store name (case-insensitive)
    function getDealForStore(storeName) {
        const lower = (storeName || '').toLowerCase();
        return getActiveDeals().find(d => d.storeName.toLowerCase() === lower) || null;
    }

    // Returns active deals filtered by store type
    function getDealsByType(type) {
        return getActiveDeals().filter(d => d.storeType === type);
    }

    // Build a fast Set of store names that have active deals (for icon check)
    function buildDealSet() {
        const s = new Set();
        getActiveDeals().forEach(d => s.add(d.storeName.toLowerCase()));
        return s;
    }

    // Merge server deals into the local array (called on page load when backend is up)
    async function syncFromServer() {
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) return;
            const { deals } = await res.json();
            if (!Array.isArray(deals)) return;
            // Merge: server deals take precedence over local ones with the same id
            const localById = new Map((window.DIG_IN_DEALS || []).map(d => [d.id, d]));
            deals.forEach(d => localById.set(d.id, d));
            window.DIG_IN_DEALS = [...localById.values()];
        } catch {
            // Backend offline — local data still works
        }
    }

    // POST a new community deal to the backend
    async function submitDeal(payload) {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        const deal = await res.json();
        // Also push into local array for immediate display
        (window.DIG_IN_DEALS = window.DIG_IN_DEALS || []).push(deal);
        return deal;
    }

    // Upvote or downvote a deal
    async function voteDeal(id, vote) {
        const res = await fetch(`${API_BASE}/${id}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    }

    // Fetch rotating live chain deals from /api/live-deals
    async function fetchLiveDeals() {
        try {
            const res = await fetch('http://localhost:5000/api/live-deals');
            if (!res.ok) return null;
            const data = await res.json();
            if (!Array.isArray(data.deals)) return null;
            // Merge into DIG_IN_DEALS, replacing any previous live_ entries
            window.DIG_IN_DEALS = [
                ...(window.DIG_IN_DEALS || []).filter(d => d.source !== 'live'),
                ...data.deals,
            ];
            return data;
        } catch {
            return null;
        }
    }

    return { getActiveDeals, getDealForStore, getDealsByType, buildDealSet, syncFromServer, submitDeal, voteDeal, fetchLiveDeals };
})();
