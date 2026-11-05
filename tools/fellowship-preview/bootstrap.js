import {simulateAccount,resetDemo,store} from './fixture-sdk.js';
const week=document.getElementById('weekSelect');
for(let n=1;n<=52;n++){const option=document.createElement('option');option.value=n;option.textContent='Week '+n;week.append(option);}
week.value=new URLSearchParams(location.search).get('week')||'12';
week.addEventListener('change',()=>{const route=window.HGRoute.read();window.HGRoute.write(route.card,{...window.HGRoute.getState(route),week:week.value},{announce:false});if(route.card==='fellowship')window.HGRoute.restoreCard('fellowship',document);});
document.getElementById('previewTheme').addEventListener('change',event=>{const value=event.target.value;document.documentElement.setAttribute('data-hg-theme-preset',value);document.documentElement.setAttribute('data-hg-theme-diagnostic',value==='diagnostic'?'on':'off');});
document.getElementById('previewAccount').addEventListener('change',event=>simulateAccount(event.target.value));
document.getElementById('previewReset').onclick=async()=>{resetDemo();await simulateAccount('alice');document.getElementById('previewAccount').value='alice';await window.loadCard('fellowship',{fromRoute:true});};
document.getElementById('openFellowship').onclick=()=>window.loadCard('fellowship');
if(!new URLSearchParams(location.search).has('card'))window.HGRoute.write('fellowship',{view:'prayer',week:week.value},{replace:true,announce:false});
await import('/js/app.js');
// Read-only test diagnostics; no production configuration or credentials exist here.
window.previewDiagnostics=()=>({account:store.user?.uid,authListeners:store.auth.size,snapshotListeners:store.snapshots.size,records:store.docs.size});
