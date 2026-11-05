// Rollout only; Firestore rules remain the private-data authorization boundary.
export async function authorizeFellowshipLive({auth,getIdTokenResult,fetcher=fetch,signal,forceRefresh=false,now=()=>Date.now()}) {
  const response=await fetcher('data/fellowship-live.json',{cache:'no-store',signal});
  if(!response.ok)throw Error('Live Fellowship unavailable');
  const config=await response.json(),start=Date.parse(config.startsAt),end=Date.parse(config.expiresAt);
  const ids=config.testAccountUids;
  if(config.version!==1||config.enabled!==true||config.mode!=='live-test-accounts'
    ||!Array.isArray(ids)||(ids.length!==1&&ids.length!==2)||new Set(ids).size!==ids.length
    ||!ids.every(id=>typeof id==='string'&&id.length>0&&id.length<=128)
    ||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>86400000
    ||now()<start||now()>=end)throw Error('Live Fellowship unavailable');
  await auth.authStateReady();
  const user=auth.currentUser;
  if(!user||user.isAnonymous||!ids.includes(user.uid))throw Error('Live Fellowship unavailable');
  const uid=user.uid,token=await getIdTokenResult(user,forceRefresh);
  if(signal?.aborted||now()<start||now()>=end||auth.currentUser?.uid!==uid
    ||!Number.isFinite(Date.parse(token.expirationTime))||Date.parse(token.expirationTime)<=now())throw Error('Live Fellowship unavailable');
  return Object.freeze({uid,expiresAt:end});
}
