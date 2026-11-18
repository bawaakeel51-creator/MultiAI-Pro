const $=id=>document.getElementById(id);
let token='',endpoint='',history=[],busy=false,controller,session=0;
function status(text){$('status').textContent=text;}
function render(){
 $('messages').replaceChildren();
 for(const m of history){const item=document.createElement('div');item.className='message '+m.role;const label=document.createElement('b');label.textContent=m.role==='user'?'You':'Gemini';item.append(label,document.createTextNode(m.content));$('messages').append(item);}
 $('messages').scrollTop=$('messages').scrollHeight;
}
$('signin').onclick=()=>{
 try{const url=new URL($('endpoint').value);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw Error();
 if(!/^[A-Za-z0-9_-]{43,128}$/.test($('token').value))throw Error();
 if(token)$('prompt').value='';
 controller?.abort();session++;busy=false;endpoint=url.origin;token=$('token').value;$('token').value='';history=[];render();$('send').disabled=false;$('access').open=false;
 status('Private access loaded. Authentication is checked when you send a message.');
 }catch{status('Enter a valid HTTPS Worker origin and owner-issued access token.');}
};
$('signout').onclick=()=>{controller?.abort();session++;token='';history=[];busy=false;render();$('prompt').value='';$('token').value='';$('send').disabled=true;$('access').open=true;status('Signed out. Chat cleared.');};
$('composer').onsubmit=async event=>{
 event.preventDefault();if(busy||!token)return;const submittedDraft=$('prompt').value;const text=submittedDraft.trim();if(!text)return;
 if(history.some(message=>message.content.length>2000)){status('The previous reply is too long to send as history. Sign out and reconnect to start a new chat.');return;}
 if(history.length>=10){status('Conversation limit reached. Sign out and reconnect to start a new chat.');return;}
 const messages=[...history,{role:'user',content:text}];if(messages.reduce((n,m)=>n+m.content.length,0)>8000){status('Conversation too long. Start a new chat.');return;}
 busy=true;$('send').disabled=true;status('Waiting for a response…');const requestController=new AbortController();controller=requestController;const active=session;const timer=setTimeout(()=>requestController.abort(),25000);
 try{const response=await fetch(endpoint+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({messages}),signal:requestController.signal,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'});const data=await response.json();if(session!==active)return;
 if(!response.ok)throw Error(data.error||'Request failed');if(typeof data.answer!=='string')throw Error('Invalid response');history=[...messages,{role:'assistant',content:data.answer}];render();if($('prompt').value===submittedDraft)$('prompt').value='';status(`Reply received. ${data.remaining} requests left today.`);
 }catch(error){if(session===active)status(error.name==='AbortError'?'Request cancelled or timed out.':error.message||'Connection failed.');}
 finally{clearTimeout(timer);if(session===active){busy=false;$('send').disabled=!token;$('prompt').focus();}}
};
