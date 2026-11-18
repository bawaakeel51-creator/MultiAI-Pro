import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function ui(fetcher=async()=>Response.json({answer:'<img src=x onerror=alert(1)>',remaining:19}),timers={setTimeout,clearTimeout}){
 const {document}=parseHTML(html);const calls=[];
 const context={document,URL,AbortController,...timers,fetch:async(...args)=>{calls.push(args);return fetcher(...args);}};
 vm.runInNewContext(app,context);
 const $=id=>document.getElementById(id);
 const signin=()=>{$('endpoint').value='https://mock.example';$('token').value='a'.repeat(43);$('signin').onclick();};
 const send=async text=>{$('prompt').value=text;await $('composer').onsubmit({preventDefault(){}});};
 return {$,calls,signin,send};
}
test('UI rejects insecure endpoint and invalid token without network',()=>{const u=ui();u.$('endpoint').value='http://mock.example';u.$('token').value='a'.repeat(43);u.$('signin').onclick();assert.match(u.$('status').textContent,/valid HTTPS/);assert.equal(u.calls.length,0);});
test('UI mock chat escapes model HTML and clears private state on signout',async()=>{const u=ui();u.signin();assert.equal(u.$('token').value,'');await u.send('Hi');assert.equal(u.$('messages').querySelectorAll('img').length,0);assert.match(u.$('messages').textContent,/<img/);assert.equal(u.calls.length,1);assert.equal(u.calls[0][1].credentials,'omit');u.$('signout').onclick();assert.equal(u.$('messages').textContent,'');assert.equal(u.$('send').disabled,true);await u.send('blocked');assert.equal(u.calls.length,1);});
test('UI shows AI OFF error and retains unsent prompt',async()=>{const u=ui(async()=>Response.json({error:'AI is disabled pending owner approval'},{status:503}));u.signin();await u.send('Hi');assert.match(u.$('status').textContent,/AI is disabled/);assert.equal(u.$('prompt').value,'Hi');assert.equal(u.$('send').disabled,false);});
test('UI ignores stale reply after signout',async()=>{let finish;const u=ui(()=>new Promise(r=>{finish=r;}));u.signin();const pending=u.send('Hi');u.$('signout').onclick();finish(Response.json({answer:'Late response',remaining:19}));await pending;assert.equal(u.$('messages').textContent,'');assert.match(u.$('status').textContent,/Signed out/);});
test('UI prevents duplicate submissions',async()=>{let finish;const u=ui(()=>new Promise(r=>{finish=r;}));u.signin();const first=u.send('Hi');await u.send('duplicate');assert.equal(u.calls.length,1);finish(Response.json({answer:'OK',remaining:19}));await first;});
test('static security and mobile layout safeguards are present',()=>{assert.match(html,/width=device-width,initial-scale=1/);assert.match(html,/Content-Security-Policy/);assert.match(html,/type="password"/);assert.match(html,/role="log"/);assert.match(html,/role="status"/);assert(!/localStorage|sessionStorage|innerHTML|eval\(/.test(app));const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');assert.match(css,/@media\(max-width:400px\)/);assert.match(css,/overflow-wrap:anywhere/);assert.match(css,/min-height:44px/);assert.match(css,/:focus-visible/);});

test('stale request timeout cannot abort a newer signed-in session',async()=>{
 const callbacks=[],responses=[];
 const u=ui(()=>new Promise(resolve=>responses.push(resolve)),{setTimeout:fn=>{callbacks.push(fn);return callbacks.length;},clearTimeout(){}});
 u.signin();const first=u.send('First');u.$('signout').onclick();u.signin();const second=u.send('Second');
 callbacks[0]();
 assert.equal(u.calls[1][1].signal.aborted,false);
 responses[0](Response.json({answer:'Stale',remaining:19}));responses[1](Response.json({answer:'Current',remaining:19}));
 await Promise.all([first,second]);
 assert.match(u.$('messages').textContent,/Current/);assert(!u.$('messages').textContent.includes('Stale'));
});

test('reply preserves a new draft and changing sessions clears private drafts', async () => {
  let finish;
  const u = ui(() => new Promise(resolve => { finish = resolve; }));
  u.signin();
  const pending = u.send('First message');
  u.$('prompt').value = 'Private next draft';
  finish(Response.json({answer: 'Done', remaining: 19}));
  await pending;
  assert.equal(u.$('prompt').value, 'Private next draft');
  u.signin();
  assert.equal(u.$('prompt').value, '');
});

test('oversize assistant history explains how to restart before another network request', async () => {
  const u = ui(async () => Response.json({answer: 'x'.repeat(2001), remaining: 19}));
  u.signin();
  await u.send('Hello');
  await u.send('Continue');
  assert.equal(u.calls.length, 1);
  assert.match(u.$('status').textContent, /Sign out and reconnect/);
});
