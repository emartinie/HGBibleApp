// Runs only a checksum-pinned local emulator and a fixed demo project.
const {spawn}=require('node:child_process');
const fs=require('node:fs');const path=require('node:path');const net=require('node:net');const crypto=require('node:crypto');
const project='demo-homegroups-commons-phase1',host='127.0.0.1',port=8088;
const checksum='9d43599ed6151199e8d604dc87fac51218e49e5f3a48519b1ae560bbe5e3382d';
function listening(){return new Promise(resolve=>{const socket=net.connect({host,port});socket.once('connect',()=>{socket.destroy();resolve(true)});socket.once('error',()=>resolve(false));});}
async function main(){
 const jar=process.env.FIRESTORE_EMULATOR_JAR;
 if(!jar||!fs.existsSync(jar))throw Error('Set FIRESTORE_EMULATOR_JAR to cloud-firestore-emulator-v1.19.8.jar. See README.md; no production fallback is allowed.');
 if(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex')!==checksum)throw Error('Unexpected Firestore emulator checksum.');
 if(await listening())throw Error('Port 8088 is already in use. Refusing to test or clear an unknown service.');
 const emulator=spawn(process.env.JAVA_BIN||'java',['-Xmx256m','-Duser.language=en','-jar',path.resolve(jar),'--host',host,'--port',String(port),'--project_id',project,'--single_project_mode','true','--rules',path.resolve(__dirname,'../../firebase/commons-phase1.rules.proposed')],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 let launchError=null,exited=false,logs='';emulator.on('error',e=>{launchError=e});emulator.on('exit',()=>{exited=true});
 for(const stream of [emulator.stdout,emulator.stderr])stream.on('data',data=>{logs+=data.toString();});
 try{
  const deadline=Date.now()+45000;
  while(!(await listening())){if(launchError)throw launchError;if(exited)throw Error('Emulator exited: '+logs);if(Date.now()>deadline)throw Error('Emulator startup timed out: '+logs);await new Promise(r=>setTimeout(r,200));}
  const env={...process.env,FIRESTORE_EMULATOR_HOST:host+':'+port,GCLOUD_PROJECT:project};
  delete env.GOOGLE_APPLICATION_CREDENTIALS;
  const exit=await new Promise((resolve,reject)=>{const tests=spawn(process.execPath,['--test','--test-timeout=60000',path.join(__dirname,'rules.test.cjs')],{stdio:'inherit',env,windowsHide:true});tests.on('error',reject);tests.on('exit',resolve);});
  if(exit!==0)throw Error('Rules tests failed ('+exit+'). Emulator log:\n'+logs);
 }finally{emulator.kill();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
