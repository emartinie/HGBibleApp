// No URL, localStorage, display name or client profile can grant this permission.
export async function authorizeFellowshipTest({auth,getIdTokenResult,fetcher=fetch,signal,forceRefresh=false,now=()=>Date.now()}) {
 const response=await fetcher('data/fellowship-testing.json',{cache:'no-store',signal});
 if(!response.ok)throw new Error('Testing unavailable');
 const config=await response.json();
 const start=Date.parse(config.startsAt),end=Date.parse(config.expiresAt),time=now();
 if(config.version!==1||config.enabled!==true||config.mode!=='readonly-fixtures'
   ||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>86400000||time<start||time>=end)throw new Error('Testing unavailable');
 await auth.authStateReady();
 const user=auth.currentUser;
 if(!user||user.isAnonymous)throw new Error('Testing unavailable');
 const uid=user.uid,result=await getIdTokenResult(user,forceRefresh);
 if(signal?.aborted||auth.currentUser?.uid!==uid||result.claims?.homegroupsOwner!==true
   ||!Number.isFinite(Date.parse(result.expirationTime))||Date.parse(result.expirationTime)<=now())throw new Error('Testing unavailable');
 return Object.freeze({uid,expiresAt:end,readOnlyFixtures:true});
}
