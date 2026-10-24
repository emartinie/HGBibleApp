// Shared presentation/navigation only. Existing pages own Firebase and account state.
const HOME = new URL('./', import.meta.url);
const APP = new URL('../../../../', HOME);
const params = new URLSearchParams(location.search);
const week = ['1', '2', '3', '4'].includes(params.get('week')) ? params.get('week') : null;
const areas = ['study', 'projects', 'fellowship', 'prayer', 'discipleship', 'family'];
let area = areas.includes(params.get('area')) ? params.get('area') : week ? 'study' : null;
const page = location.pathname.slice(HOME.pathname.length).split('/')[0] || 'preview';
const preview = page === 'preview' || page === 'index.html';
const tabs = [['conversations', 'Conversations'], ['activity', 'Activity'], ['directory', 'Communities'], ['find-users', 'Find People'], ['direct-live', 'Private Messages'], ['member', 'Profile'], ['auth', 'Account']];
function localURL(name) {
 const url = name === 'find-users' ? new URL('find-users/', APP) : new URL(name + '/', HOME);
 if (week) url.searchParams.set('week', week);
 if (area) url.searchParams.set('area', area);
 return url;
}
function link(text, href, className) {
 const anchor = document.createElement('a');anchor.textContent = text;anchor.href = href;
 if(className)anchor.className = className;return anchor;
}
const shell = document.createElement('header');shell.className = 'messaging-shell';
const row = document.createElement('div');row.className = 'messaging-brand-row';
const brand = link('', localURL('conversations'), 'messaging-brand');
const mark = document.createElement('span');mark.className = 'messaging-mark';mark.textContent = '⌂';mark.setAttribute('aria-hidden', 'true');
const names = document.createElement('span');
const label = document.createElement('strong');label.textContent = 'Messaging';
const by = document.createElement('small');by.textContent = 'HOMEGROUPS';names.append(label, by);brand.append(mark, names);
const study = new URL(APP);study.searchParams.set('card', 'mainstage');if(week)study.searchParams.set('week', week);
const back = link('← Return to study', study, 'messaging-back');back.target = '_top';
back.addEventListener('click', event => {
 if (window.parent === window || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
 event.preventDefault();window.parent.postMessage({messagingAction:'returnToStudy'}, location.origin);
});
row.append(brand, back);
const nav = document.createElement('nav');nav.className = 'messaging-nav';nav.setAttribute('aria-label', 'Messaging');
for (const [key, text] of tabs) {
 const anchor = link(text, localURL(key));if(page === key)anchor.setAttribute('aria-current', 'page');nav.append(anchor);
}
shell.append(row, nav);
if (week || preview) {
 const context = document.createElement('p');context.className = 'messaging-context';
 context.textContent = preview ? 'Local preview · Sample conversations, separate from your live messages' : 'Opened from Week ' + week + ' study';
 shell.append(context);
}
document.body.prepend(shell);
document.body.classList.add('messaging-page');if(preview)document.body.classList.add('messaging-preview');
// Keep existing deep links and explicit community choices; carry the originating week to linked screens.
function decorate(anchor) {
 const raw = anchor.getAttribute('href');if(!raw || raw.startsWith('#') || anchor.hasAttribute('download'))return;
 let url;try{url = new URL(raw, location.href);}catch{return;}
 if(url.origin !== HOME.origin || !url.pathname.startsWith(HOME.pathname))return;
 const destination = url.pathname.slice(HOME.pathname.length).split('/')[0];
 if(!tabs.some(([key])=>key===destination))return;
 if(week)url.searchParams.set('week',week);
 if(area && !url.searchParams.has('area'))url.searchParams.set('area',area);
 if(destination==='auth' && page!=='auth' && !url.searchParams.has('next'))url.searchParams.set('next',location.pathname+location.search+location.hash);
 if(url.href!==anchor.href)anchor.href=url.href;
}
function decorateAll(parent){if(parent instanceof HTMLAnchorElement)decorate(parent);parent.querySelectorAll?.('a[href]').forEach(decorate);}
decorateAll(document.body);
const observer = new MutationObserver(records => {
 for(const record of records){if(record.type==='attributes')decorate(record.target);else for(const added of record.addedNodes)if(added.nodeType===1)decorateAll(added);}
});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['href']});
document.addEventListener('change',event=>{
 if(page!=='conversations' || event.target.id!=='area' || !areas.includes(event.target.value))return;
 area=event.target.value;
 for(const anchor of shell.querySelectorAll('a')){
  const url=new URL(anchor.href);if(!url.pathname.startsWith(HOME.pathname))continue;url.searchParams.set('area',area);anchor.href=url;
 }
});
window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
