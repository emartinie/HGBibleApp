// Public Fellowship rollout. Firestore rules remain the authorization boundary.
export async function authorizeFellowshipLive({auth,getIdTokenResult,fetcher=fetch,signal,forceRefresh=false,now=()=>Date.now()}) {
  const response=await fetcher('data/fellowship-live.json',{cache:'no-store',signal});
  if(!response.ok)throw Error('Fellowship unavailable');
  const config=await response.json();
  if(config.version!==2||config.enabled!==true||config.mode!=='public-authenticated')throw Error('Fellowship unavailable');
  await auth.authStateReady();
  const user=auth.currentUser;
  if(!user||user.isAnonymous)throw Error('Sign in to use Fellowship');
  const uid=user.uid,token=await getIdTokenResult(user,forceRefresh);
  if(signal?.aborted||auth.currentUser?.uid!==uid||!Number.isFinite(Date.parse(token.expirationTime))||Date.parse(token.expirationTime)<=now())throw Error('Fellowship unavailable');
  return Object.freeze({uid,expiresAt:Infinity});
}
