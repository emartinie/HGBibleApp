// Local-only adapter: never serves Firebase initialization or historical datasets.
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const COMMONS='My Partner/collaboration/messaging/commons/';
const files=new Map([
 ...['app','card-app-runtime','share-routing','themeDiagnostic','fellowship','fellowship-test-fixtures','prayermap'].map(n=>['/js/'+n+'.js','js/'+n+'.js']),
 ...['fellowship','prayermap'].map(n=>['/cards/'+n+'.html','cards/'+n+'.html']),
 ...['fellowship','fellowship-embedded'].map(n=>['/css/'+n+'.css','css/'+n+'.css']),
 ...['auth','member','directory','conversations','activity','direct-live','direct'].flatMap(n=>[['/'+COMMONS+n+'/',COMMONS+n+'/index.html'],['/'+COMMONS+n+'/index.html',COMMONS+n+'/index.html']]),
 ...['commons-lifecycle','direct-composer','messaging-shell','moderation/report-control'].map(n=>['/'+COMMONS+n+'.js',COMMONS+n+'.js']),
 ['/'+COMMONS+'messaging-shell.css',COMMONS+'messaging-shell.css'],['/find-users/','find-users/index.html'],['/find-users/index.html','find-users/index.html'],
 ...['bootstrap.js','fixture-sdk.js','leaflet.js','preview.css'].map(n=>['/__preview__/'+n,'tools/fellowship-preview/'+n])
]);
const syntheticMap=JSON.stringify({type:'FeatureCollection',features:[{type:'Feature',properties:{Name:'Demo gathering — synthetic',Coordinates:'-87.44,36.13',Description:'Fictional preview record; not a real member or meeting place.'},geometry:{type:'Point',coordinates:[-87.44,36.13]}}]});
function rewriteSDK(text){return text.replace(/https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-[a-z-]+\.js/g,'/__preview__/fixture-sdk.js');}
async function shell(){const index=await fs.readFile(path.join(ROOT,'index.html'),'utf8');const theme=index.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1]||'';return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HomeGroups Fellowship — LOCAL DEMO</title><style>'+theme+'</style><link rel="stylesheet" href="/__preview__/preview.css"></head><body><aside id="previewControls" aria-label="Local preview controls"><strong>LOCAL DEMO · synthetic data only</strong><span>No real accounts, messages, memberships, emails or location data.</span><div><label>Theme <select id="previewTheme"><option value="cosmic">Dark</option><option value="parchment">Light</option><option value="sapphire">Sapphire</option><option value="diagnostic">Diagnostic</option></select></label><label>Demo account <select id="previewAccount"><option value="alice">Demo Alice</option><option value="bob">Demo Bob</option><option value="guest">Signed out</option></select></label><label>Study week <select id="weekSelect"></select></label><label>Card <select id="cardSelector"><option value="">Study placeholder</option><option value="fellowship">Fellowship</option></select></label><button id="previewReset" type="button">Reset demo</button></div></aside><main id="viewport"><div id="cardsRow"><section class="card" id="mainStageCard"><h2>Study context placeholder</h2><p>The complete Bible, audio and time-system boot is outside this isolated preview.</p><button id="openFellowship" type="button">Open Fellowship</button></section><section class="card" id="dynamicCard"><div id="loadedCardHost"></div></section></div></main><script src="/js/share-routing.js"></script><script src="/js/themeDiagnostic.js"></script><script src="/__preview__/leaflet.js"></script><script type="module" src="/__preview__/bootstrap.js"></script></body></html>';}
function createPreviewServer(){return http.createServer(async(req,res)=>{
 const port=res.socket.localPort,host=req.headers.host;
 const headers={'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'geolocation=(), camera=(), microphone=()'};
 const send=(code,body,type='text/plain')=>{res.writeHead(code,{...headers,'Content-Type':type+'; charset=utf-8'});res.end(req.method==='HEAD'?undefined:body);};
 if(!['127.0.0.1:'+port,'localhost:'+port].includes(host))return send(403,'Loopback Host required');
 if(!['GET','HEAD'].includes(req.method))return send(405,'This preview accepts no server writes');
 try{const url=new URL(req.url,'http://'+host),name=decodeURIComponent(url.pathname);
  if(name==='/')return send(200,await shell(),'text/html');
  if(name==='/__preview__/component-entry.js')return send(200,"import '/js/card-app-runtime.js';",'text/javascript');
  if(name==='/js/firebase-init.js')return send(200,"export {auth,db,app} from '/__preview__/fixture-sdk.js';",'text/javascript');
  if(name==='/js/timeStore.js')return send(200,'export const TimeStore={start(){}};','text/javascript');
  if(name==='/js/firebaseTimeLoader.js')return send(200,'export function initializeTimeSystem(){}','text/javascript');
  if(['/data/HomeGroupsMap.geojson','/HomeGroupsMap.geojson'].includes(name))return send(200,syntheticMap,'application/json');
  const file=files.get(name);if(!file)return send(404,'Not available in the isolated preview');
  const type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html';
  let body=rewriteSDK(await fs.readFile(path.join(ROOT,file),'utf8'));
  if(type==='text/html')body=body.replace('</head>','<link rel="stylesheet" href="/__preview__/preview.css"></head>').replace('<body>','<body><p class="preview-synthetic-notice" role="note">Local demo · fictional accounts and data. Use fictional details only; no real delivery or authentication.</p>');
  return send(200,body,type);
 }catch{return send(404,'Not available in the isolated preview');}
});}
module.exports={createPreviewServer};
if(require.main===module){const port=Number(process.env.HG_PREVIEW_PORT||4318);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Use a port from 1024 to 65535');const server=createPreviewServer();server.on('error',error=>{console.error(error.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log('Synthetic local preview: http://127.0.0.1:'+port+'/?card=fellowship&view=prayer&week=12\nNo production Firebase or original GeoJSON is served. Stop with Ctrl+C.'));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close());}
