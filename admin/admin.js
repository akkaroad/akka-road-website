import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '/supabase-config.js';

const configured = isSupabaseConfigured();
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const authView = document.querySelector('#authView'), appView = document.querySelector('#appView');
const authMessage = document.querySelector('#authMessage'), content = document.querySelector('#content');
let currentView = 'overview';

if (!configured) { document.querySelector('#setupNotice').hidden = false; authMessage.textContent = 'The dashboard files are ready. Supabase still needs to be connected.'; }
else { init(); }

document.querySelector('#loginForm').addEventListener('submit', async e => { e.preventDefault(); if (!supabase) return; authMessage.textContent='Signing in…'; const { error }=await supabase.auth.signInWithPassword({email:email.value,password:password.value}); authMessage.textContent=error?.message||''; });
document.querySelector('#signOut').addEventListener('click',()=>supabase?.auth.signOut());
document.querySelector('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return; currentView=b.dataset.view; document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x===b)); document.querySelector('#pageTitle').textContent=b.textContent; render();});

async function init(){ const {data:{session}}=await supabase.auth.getSession(); setSession(session); supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); }
async function setSession(session){
  if(!session){ authView.hidden=false; appView.hidden=true; return; }
  authMessage.textContent='';
  authView.hidden=true;
  appView.hidden=false;
  render();
}
async function render(){ content.innerHTML='<p>Loading…</p>'; try{ if(currentView==='overview') return overview(); if(currentView==='settings') return settings(); return collection(currentView); }catch(e){content.innerHTML=`<p class="message">${escapeHtml(e.message)}</p>`;} }
async function overview(){ const tables=['band_members','posts','releases','events','media']; const counts={}; await Promise.all(tables.map(async t=>{const {count}=await supabase.from(t).select('*',{count:'exact',head:true});counts[t]=count||0;})); content.innerHTML=`<div class="cards">${[['Band members',counts.band_members],['News posts',counts.posts],['Releases',counts.releases],['Media items',counts.media]].map(x=>`<div class="card"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}</div><div class="panel"><h2>Ready for the team</h2><p>Use the menu to update the public website. Changes marked “Published” appear automatically.</p></div>`; }
async function settings(){ const {data}=await supabase.from('site_settings').select('*').limit(1).maybeSingle(); const d=data||{}; content.innerHTML=`<form id="recordForm" class="panel"><input type="hidden" name="id" value="${d.id||''}">${field('hero_title','Hero headline',d.hero_title)}${area('hero_copy','Hero paragraph',d.hero_copy)}<div class="grid">${field('booking_email','Booking email',d.booking_email,'email')}${field('instagram_url','Instagram URL',d.instagram_url,'url')}${field('shop_url','Shop URL',d.shop_url,'url')}</div><div class="form-actions"><button>Save website settings</button></div></form>`; document.querySelector('#recordForm').onsubmit=e=>saveForm(e,'site_settings'); }
const schemas={
 members:{table:'band_members',title:'Band member',fields:[['name','Name','text'],['role','Role / instrument','text'],['bio','Bio','textarea'],['photo_url','Photo URL','url'],['sort_order','Order','number'],['published','Published','checkbox']]},
 posts:{table:'posts',title:'News post',fields:[['title','Title','text'],['excerpt','Short summary','textarea'],['body','Full post','textarea'],['published_at','Publish date','datetime-local'],['published','Published','checkbox']]},
 releases:{table:'releases',title:'Release',fields:[['title','Title','text'],['description','Description','textarea'],['release_date','Release date','date'],['artwork_url','Artwork URL','url'],['spotify_url','Spotify URL','url'],['apple_music_url','Apple Music URL','url'],['youtube_url','YouTube URL','url'],['published','Published','checkbox']]},
 events:{table:'events',title:'Show / event',fields:[['title','Title','text'],['event_date','Date and time','datetime-local'],['location','Location','text'],['ticket_url','Ticket URL','url'],['description','Details','textarea'],['published','Published','checkbox']]},
 media:{table:'media',title:'Media item',fields:[['title','Title','text'],['type','Type','select:photo,video'],['url','Photo or video URL','url'],['caption','Caption','textarea'],['published','Published','checkbox']]}
};
async function collection(key){const s=schemas[key];const {data,error}=await supabase.from(s.table).select('*').order('created_at',{ascending:false});if(error)throw error;content.innerHTML=`<div class="panel"><h2>Add ${s.title}</h2>${formHtml(s)}</div><div class="list">${(data||[]).map(r=>itemHtml(s,r)).join('')||'<p>No items yet.</p>'}</div>`; document.querySelector('#recordForm').onsubmit=e=>saveForm(e,s.table); document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>fillForm(s,data.find(r=>String(r.id)===b.dataset.edit)));document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeRecord(s.table,b.dataset.delete)); }
function formHtml(s){return `<form id="recordForm"><input type="hidden" name="id">${s.fields.map(([n,l,t])=>input(n,l,t,'')).join('')}<div class="form-actions"><button>Save</button><button type="button" class="secondary" onclick="this.form.reset()">Clear</button></div></form>`}
function itemHtml(s,r){const title=r.title||r.name||s.title;const sub=r.role||r.location||r.type||'';return `<article class="item"><div><span class="status">${r.published?'Published':'Draft'}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(sub)}</p></div><div class="item-actions"><button class="secondary" data-edit="${r.id}">Edit</button><button class="danger" data-delete="${r.id}">Delete</button></div></article>`}
function fillForm(s,r){const f=document.querySelector('#recordForm');f.id.value=r.id;for(const [n,,t] of s.fields){const el=f.elements[n];if(!el)continue;if(t==='checkbox')el.checked=!!r[n];else if(t==='datetime-local'&&r[n])el.value=new Date(r[n]).toISOString().slice(0,16);else el.value=r[n]??'';}f.scrollIntoView({behavior:'smooth'});}
async function saveForm(e,table){e.preventDefault();const fd=new FormData(e.target),id=fd.get('id'),obj={};for(const [k,v] of fd.entries()){if(k!=='id')obj[k]=v;}e.target.querySelectorAll('input[type=checkbox]').forEach(x=>obj[x.name]=x.checked);e.target.querySelectorAll('input[type=number]').forEach(x=>obj[x.name]=x.value?Number(x.value):null);const q=id?supabase.from(table).update(obj).eq('id',id):supabase.from(table).insert(obj);const {error}=await q;if(error)alert(error.message);else render();}
async function removeRecord(table,id){if(!confirm('Delete this item?'))return;const {error}=await supabase.from(table).delete().eq('id',id);if(error)alert(error.message);else render();}
function input(n,l,t,v){if(t==='textarea')return area(n,l,v);if(t==='checkbox')return `<label class="field"><span><input type="checkbox" name="${n}"> ${l}</span></label>`;if(t.startsWith('select:'))return `<label class="field">${l}<select name="${n}">${t.split(':')[1].split(',').map(x=>`<option>${x}</option>`).join('')}</select></label>`;return field(n,l,v,t)}
function field(n,l,v='',t='text'){return `<label class="field">${l}<input name="${n}" type="${t}" value="${escapeHtml(v||'')}"></label>`}function area(n,l,v=''){return `<label class="field">${l}<textarea name="${n}">${escapeHtml(v||'')}</textarea></label>`}function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
