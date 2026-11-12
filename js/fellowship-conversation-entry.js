import {mountConversation} from './fellowship-conversation.js';
const view=mountConversation(document,{onReady:()=>window.dispatchEvent(new Event('hg:discussion-ready'))});
window.HGDiscussionView=view;
window.addEventListener('hg:fellowship-dispose',()=>view.dispose(),{once:true});
window.addEventListener('pagehide',()=>view.dispose(),{once:true});
