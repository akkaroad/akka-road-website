import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '/supabase-config.js';

if (isSupabaseConfigured()) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  hydratePublicSite(supabase).catch(console.error);
}

async function hydratePublicSite(supabase) {
  const [settingsRes, releasesRes, eventsRes, mediaRes, membersRes, postsRes] = await Promise.all([
    supabase.from('site_settings').select('*').limit(1).maybeSingle(),
    supabase.from('releases').select('*').eq('published', true).order('release_date', { ascending: false }).limit(1),
    supabase.from('events').select('*').eq('published', true).order('event_date', { ascending: true }).limit(6),
    supabase.from('media').select('*').eq('published', true).order('created_at', { ascending: false }).limit(6),
    supabase.from('band_members').select('*').eq('published', true).order('sort_order'),
    supabase.from('posts').select('*').eq('published', true).order('published_at', { ascending: false }).limit(3),
  ]);

  const settings = settingsRes.data;
  if (settings) {
    setText('[data-content="hero-title"]', settings.hero_title);
    setText('[data-content="hero-copy"]', settings.hero_copy);
    setLink('[data-content="booking-email"]', `mailto:${settings.booking_email}?subject=Akka%20Road%20Booking`);
    setLink('[data-content="instagram"]', settings.instagram_url);
    setLink('[data-content="shop"]', settings.shop_url);
  }

  const release = releasesRes.data?.[0];
  if (release) {
    setText('[data-content="release-title"]', release.title);
    setText('[data-content="release-description"]', release.description);
    setLink('[data-content="spotify"]', release.spotify_url);
    setLink('[data-content="apple"]', release.apple_music_url);
    setLink('[data-content="youtube"]', release.youtube_url);
  }

  const events = eventsRes.data || [];
  if (events.length) {
    const list = document.querySelector('[data-list="events"]');
    list.innerHTML = events.map(event => `
      <div class="event-item">
        <span>${formatDate(event.event_date)}</span>
        <strong>${escapeHtml(event.title)}</strong>
        <em>${escapeHtml(event.location || 'Details coming soon')}</em>
      </div>`).join('');
  }

  const media = mediaRes.data || [];
  if (media.length) {
    const grid = document.querySelector('[data-list="media"]');
    grid.innerHTML = media.map(item => item.type === 'video'
      ? `<a class="media-card media-image" href="${safeUrl(item.url)}" target="_blank" rel="noreferrer"><span>▶ ${escapeHtml(item.title)}</span></a>`
      : `<figure class="media-card media-image" style="background-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.5)),url('${safeUrl(item.url)}')"><figcaption>${escapeHtml(item.title)}</figcaption></figure>`
    ).join('');
  }

  const members = membersRes.data || [];
  if (members.length) {
    const section = document.querySelector('[data-section="members"]');
    section.hidden = false;
    section.querySelector('[data-list="members"]').innerHTML = members.map(member => `
      <article class="member-card">
        ${member.photo_url ? `<img src="${safeUrl(member.photo_url)}" alt="${escapeHtml(member.name)}">` : ''}
        <div><h3>${escapeHtml(member.name)}</h3><p class="member-role">${escapeHtml(member.role || '')}</p><p>${escapeHtml(member.bio || '')}</p></div>
      </article>`).join('');
  }

  const posts = postsRes.data || [];
  if (posts.length) {
    const section = document.querySelector('[data-section="news"]');
    section.hidden = false;
    section.querySelector('[data-list="posts"]').innerHTML = posts.map(post => `
      <article class="news-card"><p class="eyebrow">${formatDate(post.published_at)}</p><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.excerpt || '')}</p></article>`).join('');
  }
}

function setText(selector, value) { if (value) document.querySelector(selector)?.replaceChildren(document.createTextNode(value)); }
function setLink(selector, value) { if (value) document.querySelector(selector)?.setAttribute('href', value); }
function formatDate(value) { if (!value) return 'TBA'; return new Intl.DateTimeFormat('en-CA', { month:'short', day:'numeric', year:'numeric' }).format(new Date(value)); }
function safeUrl(value='') { try { const u = new URL(value, location.origin); return ['http:','https:'].includes(u.protocol) ? u.href : '#'; } catch { return '#'; } }
function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
