import {mountConversation} from './fellowship-conversation.js';
import {mountAccount} from './fellowship-account.js';
export function createConversation(host,options){
 const root=document.createElement('section');root.className='fellowship-conversation';
 root.setAttribute('aria-label','Community conversation');
 root.dataset.post=options.params.get('post');root.dataset.area=options.params.get('area');
 root.innerHTML=`
 <span id="heading" hidden></span><span id="subheading" hidden></span>
 <p id="notice" role="status" aria-live="polite">Checking your account…</p>
 <main id="thread" aria-label="Conversation messages"></main>
 <button id="more" hidden type="button">Load earlier replies</button>
 <form id="composer" hidden>
   <textarea id="message" rows="1" maxlength="1200" required aria-label="Write a reply" placeholder="Write a message…"></textarea>
   <div class="composer-actions"><div id="attachment"></div><button class="action send" type="submit" aria-label="Send reply">Send reply</button></div>
 </form>`;
 host.append(root);return mountConversation(root,options);
}
export async function createAccount(host,options={}){
 if(!document.querySelector('link[href="/css/fellowship.css"],link[href="css/fellowship.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/css/fellowship.css';document.head.append(css);}
 const response=await fetch('/My%20Partner/collaboration/messaging/commons/auth/',{signal:options.signal});
 if(!response.ok)throw Error('Account unavailable');
 const html=await response.text();if(options.isCurrent&&!options.isCurrent())return null;
 const parsed=new DOMParser().parseFromString(html,'text/html');
 const panel=parsed.querySelector('.account-panel');if(!panel)throw Error('Account unavailable');
 const root=document.createElement('section');root.className='fellowship-account';
 root.append(document.importNode(panel,true));host.append(root);
 root.querySelector('h1').textContent='Your account';
 root.querySelector('.account-panel>small').hidden=true;root.querySelector('#guest h2').hidden=true;
 root.querySelector('h1+p').textContent='Use your HomeGroups account for Fellowship.';
 const next=root.querySelector('#continue');next.textContent='Back to Fellowship';
 next.href='/?card=fellowship-live';
 next.addEventListener('click',event=>{event.preventDefault();options.onContinue?.();});
 root.querySelector('#member>p:has(#continue)').classList.add('account-links');
 const methods=document.createElement('details');methods.className='account-methods';
 methods.innerHTML='<summary>Sign-in methods</summary>';
 root.querySelectorAll('#member h2')[1].remove();
 for(const id of ['providers','linkGoogle','linkEmailForm'])methods.append(root.querySelector('#'+id));
 root.querySelector('#signout').before(methods);
 const nextURL=new URL('/',location.origin);nextURL.searchParams.set('card','fellowship-live');
 const week=options.week||document.getElementById('weekSelect')?.value;
 if(/^([1-9]|[1-4][0-9]|5[0-2])$/.test(week||''))nextURL.searchParams.set('week',week);
 const search=options.search??'?'+new URLSearchParams({next:nextURL.pathname+nextURL.search});
 return mountAccount(root,{embedded:true,search});
}
