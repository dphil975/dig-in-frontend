/* Store hours — parses the OSM opening_hours mini-format (e.g.
   "Mo-Su 07:00-22:00", segments separated by ";") just enough to answer
   "open right now?" and to print a friendly display string. Shared by the
   Home map and the recipe-page Food Map so both pop-ups agree. */

const DAY = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };

/** OSM opening_hours string -> true (open), false (closed), null (unparsed/unknown). */
export function parseOpenNow(hoursStr) {
  if (!hoursStr) return null;
  const now = new Date();
  const todayIdx = now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  for (const seg of hoursStr.split(';').map(s => s.trim())) {
    const m = seg.match(/^([A-Za-z,\-]+)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!m) continue;
    const [, dayPart, sh, sm, eh, em] = m;
    const startMins = parseInt(sh) * 60 + parseInt(sm);
    const endMins   = parseInt(eh) * 60 + parseInt(em);
    let dayMatch = false;
    if (dayPart.includes('-')) {
      const [f, t] = dayPart.split('-');
      const fi = DAY[f], ti = DAY[t];
      if (fi !== undefined && ti !== undefined)
        dayMatch = fi <= ti ? (todayIdx >= fi && todayIdx <= ti) : (todayIdx >= fi || todayIdx <= ti);
    } else {
      dayMatch = dayPart.split(',').some(d => DAY[d.trim()] === todayIdx);
    }
    if (!dayMatch) continue;
    return endMins <= startMins
      ? (nowMins >= startMins || nowMins < endMins)   // overnight
      : (nowMins >= startMins && nowMins < endMins);
  }
  return null;
}

/** "07:00-22:00" -> "7am – 10pm" */
export function formatHoursDisplay(hoursStr) {
  if (!hoursStr) return null;
  return hoursStr.replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => {
    const hr = parseInt(h), mn = parseInt(m);
    if (hr === 0 && mn === 0)  return '12am';
    if (hr === 24 && mn === 0) return '12am';
    if (hr === 12 && mn === 0) return '12pm';
    const period = hr >= 12 ? 'pm' : 'am';
    const h12 = hr % 12 || 12;
    return mn === 0 ? `${h12}${period}` : `${h12}:${String(mn).padStart(2, '0')}${period}`;
  }).replace(/-/g, ' – ');
}
