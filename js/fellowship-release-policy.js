// UI rollout control only. Firebase rules remain the authority for private data.
export const releasePolicy=Object.freeze({
 preservePrayerMap:true,
 resolve(card){
  if(typeof card!=='string')return 'mainstage';
  if(card.startsWith('url:')){try{const url=new URL(card.slice(4),location.href);return ['https:','http:'].includes(url.protocol)?card:'unavailable';}catch{return 'unavailable';}}
  if(!/^[A-Za-z0-9_-]{1,80}$/.test(card))return 'unavailable';
  return card==='fellowship'?'fellowship-test':card;
 }
});
