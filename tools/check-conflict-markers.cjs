const {spawnSync}=require('node:child_process');

// Git's opening and closing lines carry a label. A bare line of equals
// signs can be an ordinary heading underline, so do not flag it alone.
const result=spawnSync('git',['grep','-nI','-E','^(<{7}|>{7}|[|]{7})[[:blank:]]+[^[:space:]]'],{stdio:'inherit'});
if(result.error){console.error(result.error.message);process.exitCode=2;}
else if(result.status===0){console.error('Unresolved Git conflict markers found.');process.exitCode=1;}
else if(result.status!==1){process.exitCode=result.status??2;}
