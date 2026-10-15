// Messaging moderation control. Submission stays disabled until live Firebase rules are verified.
export function attachReportControl(container,{community,postId,replyId=null}={}){
  if(!container||!community||!postId)return;
  const button=document.createElement('button');
  button.type='button';button.textContent='Report content';
  button.className='messaging-report-button';
  button.setAttribute('aria-expanded','false');
  button.style.cssText='font:inherit;font-size:.85rem;padding:.35rem .65rem;margin:.35rem 0;cursor:pointer';
  const form=document.createElement('form');form.hidden=true;form.style.cssText='padding:.7rem;border:1px solid #64748b;border-radius:8px;margin:.5rem 0';
  const explanation=document.createElement('p');explanation.textContent='Reporting is for harmful or inappropriate conduct, not differences in biblical interpretation. Reports are private and do not automatically remove content.';
  const label=document.createElement('label');label.textContent='Reason ';
  const select=document.createElement('select');select.required=true;
  for(const [value,text] of [['','Choose a reason'],['harassment','Harassment'],['threats','Threats'],['spam','Spam'],['privacy','Privacy violation'],['personal-attack','Personal attack'],['other','Other inappropriate conduct']]){
    const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);
  }
  label.append(select);
  const detailsLabel=document.createElement('label');detailsLabel.textContent=' Additional context (optional)';
  const details=document.createElement('textarea');details.maxLength=500;details.rows=2;details.style.width='100%';detailsLabel.append(details);
  const status=document.createElement('p');status.setAttribute('role','status');
  status.textContent='Report submissions are not yet available while Firebase moderation permissions are being verified.';
  const submit=document.createElement('button');submit.type='submit';submit.textContent='Submit report';submit.disabled=true;
  form.append(explanation,label,detailsLabel,status,submit);
  form.addEventListener('submit',event=>event.preventDefault());
  button.addEventListener('click',()=>{form.hidden=!form.hidden;button.setAttribute('aria-expanded',String(!form.hidden));});
  container.append(button,form);
}
