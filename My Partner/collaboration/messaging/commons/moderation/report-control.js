// Private, write-once study report submission. No client reads or moderator privileges.
import {auth,db} from '../../../../../js/firebase-init.js';
import {doc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export function attachReportControl(container,{community,postId,replyId=null}={}){
  // Current report rules authorize the Bible Study community only.
  if(!container||community!=='study'||!postId)return;
  const button=document.createElement('button');
  button.type='button';button.textContent='Report content';
  button.className='messaging-report-button';
  button.setAttribute('aria-expanded','false');
  button.style.cssText='font:inherit;font-size:.85rem;padding:.35rem .65rem;margin:.35rem 0;cursor:pointer';
  const form=document.createElement('form');form.hidden=true;form.style.cssText='padding:.7rem;border:1px solid #64748b;border-radius:8px;margin:.5rem 0';
  const explanation=document.createElement('p');
  explanation.textContent='Reporting is for harmful or inappropriate conduct, not differences in biblical interpretation. Reports are private and do not automatically remove content.';
  const label=document.createElement('label');label.textContent='Reason ';
  const select=document.createElement('select');select.required=true;
  for(const [value,text] of [['','Choose a reason'],['harassment','Harassment'],['threats','Threats'],['spam','Spam'],['privacy','Privacy violation'],['personal-attack','Personal attack'],['other','Other inappropriate conduct']]){
    const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);
  }
  label.append(select);
  const detailsLabel=document.createElement('label');detailsLabel.textContent=' Additional context (optional)';
  const details=document.createElement('textarea');details.maxLength=500;details.rows=2;details.style.width='100%';detailsLabel.append(details);
  const status=document.createElement('p');status.setAttribute('role','status');
  const submit=document.createElement('button');submit.type='submit';submit.textContent='Submit report';
  form.append(explanation,label,detailsLabel,status,submit);
  let pending=false,submitted=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(pending||submitted||!form.reportValidity())return;
    const account=auth.currentUser;
    if(!account){status.textContent='Please sign in to Messaging before submitting a report.';return;}
    const reason=select.value;
    if(!['harassment','threats','spam','privacy','personal-attack','other'].includes(reason))return;
    const uid=account.uid,reply=replyId||'',reportId=uid+'_'+postId+'_'+(reply||'post');
    pending=true;submit.disabled=true;status.textContent='Submitting your private report…';
    try{
      await setDoc(doc(db,'commonsReports',reportId),{
        reporterUid:uid,community:'study',postId,replyId:reply,
        reason,details:details.value.trim(),status:'pending',createdAt:serverTimestamp()
      });
      submitted=true;select.disabled=true;details.disabled=true;
      status.textContent='Report submitted privately for review. The content has not been removed.';
      submit.textContent='Report submitted';
    }catch(error){
      const code=error?.code||'';
      status.textContent=code==='permission-denied'
        ? 'Report not accepted. You may have already reported this item, or your community access may have changed.'
        : 'Could not submit the report ('+(code||'connection error')+'). Your explanation is preserved; please try again.';
    }finally{
      pending=false;if(!submitted)submit.disabled=false;
    }
  });
  button.addEventListener('click',()=>{form.hidden=!form.hidden;button.setAttribute('aria-expanded',String(!form.hidden));});
  container.append(button,form);
}
