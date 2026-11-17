const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {status, headers: {'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...headers}});
export async function digest(token) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function readBody(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw 415;
  const reader = request.body?.getReader();
  if (!reader) throw 400;
  let size=0, parts=[];
  while (true) {
    const {done,value}=await reader.read(); if(done) break;
    size+=value.length; if(size>16384) {await reader.cancel(); throw 413;} parts.push(value);
  }
  const bytes=new Uint8Array(size); let offset=0;
  for(const p of parts){bytes.set(p,offset);offset+=p.length;}
  try {return JSON.parse(new TextDecoder().decode(bytes));} catch {throw 400;}
}
export function validMessages(messages) {
  return Array.isArray(messages) && messages.length>0 && messages.length<=10 && messages.at(-1)?.role==='user' && messages[0]?.role==='user' && messages.every((m,i)=>m && m.role===(i%2===0?'user':'assistant') && typeof m.content==='string' && m.content.trim().length>0 && m.content.length<=2000) && messages.reduce((n,m)=>n+m.content.length,0)<=8000;
}
export class QuotaGate {
  constructor(ctx) {this.storage=ctx.storage;}
  async fetch(request) {
    const {user}=await request.json();
    if(typeof user!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(user)) return json({error:'Invalid identity'},400);
    const now=Date.now(), day=Math.floor(now/86400000), minute=Math.floor(now/60000);
    const result=await this.storage.transaction(async tx=>{
      const g=await tx.get('global') || {};
      const u=await tx.get('user:'+user) || {};
      const daily=u.day===day?u.daily:0, burst=u.minute===minute?u.burst:0;
      const total=g.day===day?g.total:0;
      if(daily>=20 || total>=100) return {ok:false,retry:Math.ceil(((day+1)*86400000-now)/1000)};
      if(burst>=3) return {ok:false,retry:Math.ceil(((minute+1)*60000-now)/1000)};
      await tx.put('global',{day,total:total+1});
      await tx.put('user:'+user,{day,daily:daily+1,minute,burst:burst+1});
      return {ok:true,remaining:19-daily};
    });
    return json(result,result.ok?200:429,result.ok?{}:{'Retry-After':String(result.retry)});
  }
}
export function createWorker(providerFetch=fetch) {
 return {async fetch(request,env) {
  const origin=request.headers.get('Origin');
  const origins=(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!origin || !origins.includes(origin)) return json({error:'Origin denied'},403);
  const cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Expose-Headers':'Retry-After'};
  const reply=(b,s=200,h={})=>json(b,s,{...cors,...h});
  if(new URL(request.url).pathname!=='/api/chat') return reply({error:'Not found'},404);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST') return reply({error:'Method not allowed'},405,{'Allow':'POST, OPTIONS'});
  try {
    const token=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43,128})$/)?.[1];
    if(!token) return reply({error:'Sign in required'},401);
    const identities=JSON.parse(env.AUTH_TOKEN_HASHES||'{}');
    if(Object.keys(identities).length>20) throw Error('Configuration');
    const hash=await digest(token);
    const user=Object.hasOwn(identities,hash)?identities[hash]:null;
    if(!user || !/^[a-zA-Z0-9_-]{1,64}$/.test(user)) return reply({error:'Invalid or revoked access token'},401);
    const body=await readBody(request);
    if(!validMessages(body?.messages)) return reply({error:'Use 1–10 alternating messages; max 2,000 characters each and 8,000 total'},400);
    if(env.AI_ENABLED!=='true') return reply({error:'AI is disabled pending owner approval'},503);
    if(!env.GEMINI_API_KEY || !/^gemini-[a-z0-9.-]+$/.test(env.GEMINI_MODEL||'') || !env.QUOTAS) throw Error('Configuration');
    const gate=env.QUOTAS.get(env.QUOTAS.idFromName('global-v1'));
    const quota=await gate.fetch(new Request('https://quota/reserve',{method:'POST',body:JSON.stringify({user})}));
    if(quota.status===429) return reply({error:'Usage limit reached'},429,{'Retry-After':quota.headers.get('Retry-After')||'60'});
    if(!quota.ok) throw Error('Quota unavailable');
    const reservation=await quota.json();
    if(reservation.ok!==true) throw Error('Quota unavailable');
    let response;
    try {
      response=await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
        body:JSON.stringify({contents:body.messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:512}}),
        signal:AbortSignal.timeout(20000),redirect:'error'
      });
    } catch {return reply({error:'AI service timed out or is unavailable. Try later.'},504);}
    if(!response.ok) return reply({error:'AI service unavailable. Try later.'},502);
    const data=await response.json();
    const candidate=data.candidates?.[0];
    if(!candidate || !['STOP','MAX_TOKENS'].includes(candidate.finishReason)) return reply({error:'No response available for this request'},422);
    const answer=candidate.content?.parts?.filter(p=>!p.thought && typeof p.text==='string').map(p=>p.text).join('');
    if(!answer || answer.length>16000) return reply({error:'No usable response received'},502);
    return reply({answer,remaining:reservation.remaining});
  } catch(error) {
    if(typeof error==='number') return reply({error:({400:'Invalid JSON',413:'Request too large',415:'Use application/json'})[error]||'Invalid request'},error);
    return reply({error:'Service unavailable'},503);
  }
 }};
}
export default createWorker();
