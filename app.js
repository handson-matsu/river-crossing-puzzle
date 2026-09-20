import {levels,initialPositions,crossRiver} from './engine.js';
const $=id=>document.getElementById(id);
let current=0,positions={},side=0,passengers=[],moves=0,busy=false,won=false,timer;
let mode="practice",gameOver=false,pendingLevel=0;
let records={};try{records=JSON.parse(localStorage.getItem('river-crossing-records')||'{}')||{};}catch{}
function renderCards(){ $('level-cards').innerHTML=levels.map((l,i)=>`<button class="level-card card-${i}" data-level="${i}"><div class="card-top"><span class="level-number">LEVEL 0${i+1}</span><span class="stars" aria-label="難易度${i+1}">${'★'.repeat(i+1)}${'☆'.repeat(4-i)}</span></div><div class="card-icons" aria-hidden="true">${l.icons}</div><h3>${l.title}</h3><p>${l.description}</p><div class="card-bottom"><span>${records[i] ? `✓ クリア済み · ベスト ${records[i]}手` : i===0?'はじめての方におすすめ':'チャレンジする'}</span><b>↗</b></div></button>`).join('');}
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function invalidAction(reason){
 message(reason,true);
 gameOver=mode==='challenge';
 if(gameOver)render();
 $('error-title').textContent=gameOver?'GAME OVER':'このままでは渡れません';
 $('error-reason').textContent=reason;
 $('practice-actions').hidden=gameOver;
 $('over-actions').hidden=!gameOver;
 $('error-dialog').classList.toggle('game-over',gameOver);
 $('error-dialog').showModal();
}
function closeDialogs(){for(const id of ['mode-dialog','error-dialog'])if($(id).open)$(id).close();}
function character(p,onBoat=false){const b=document.createElement('button');b.className=`character ${p.group?'group-'+p.group:''}`;b.innerHTML=`<span class="emoji" aria-hidden="true">${p.emoji}</span><span class="character-name">${p.name}</span>${p.group&&p.group.length===1?`<i>${p.group}</i>`:''}`;b.setAttribute('aria-label',`${p.name}${/^([mc])\d$/.test(p.id)?p.id.slice(1):''}を${onBoat?'降ろす':'乗せる'}`);b.disabled=busy||won||gameOver||(!onBoat&&positions[p.id]!==side);b.onclick=()=>{if(busy||won||gameOver)return;if(onBoat)passengers=passengers.filter(id=>id!==p.id);else {if(passengers.length===2){invalidAction('ボートは定員2人です。これ以上乗せることはできません。');return;}passengers.push(p.id);}message(passengers.length?'準備ができたら「川を渡る」を押そう。':'仲間をタップして、ボートに乗せよう。');render();};return b;}
function render(){for(const shore of [0,1]){const container=$(shore?'right-characters':'left-characters');container.replaceChildren(...levels[current].people.filter(p=>positions[p.id]===shore&&!passengers.includes(p.id)).map(p=>character(p)));if(!container.children.length){const empty=document.createElement('p');empty.className='empty-bank';empty.textContent='ここに仲間が集まります';container.append(empty);}}
$('passengers').replaceChildren(...passengers.map(id=>character(levels[current].people.find(p=>p.id===id),true)));for(let n=passengers.length;n<2;n++){const slot=document.createElement('span');slot.className='empty-seat';slot.textContent='＋';$('passengers').append(slot);}
$('boat').dataset.side=side;$('boat-count').textContent=`${passengers.length} / 2`;$('boat-location').textContent=busy?'川を渡っています…':`${side?'右岸':'左岸'}に停泊中`;$('moves').textContent=moves;$('cross').disabled=busy||won||gameOver;$('cross').innerHTML=busy?'渡っています…':`川を渡る <span>${side?'←':'→'}</span>`;}
function start(index){closeDialogs();clearTimeout(timer);gameOver=false;current=index;positions=initialPositions(index);side=0;passengers=[];moves=0;busy=false;won=false;$('mode-label').textContent=mode==='challenge'?'チャレンジモード':'練習モード';$('home').hidden=true;$('game').hidden=false;$('success').hidden=true;$('game-title').textContent=levels[index].title;$('level-label').textContent=`LEVEL 0${index+1} / 05`;$('game-stars').textContent='★'.repeat(index+1)+'☆'.repeat(4-index);$('rule-list').innerHTML=levels[index].rules.map(r=>`<li>${r}</li>`).join('');$('boat').classList.add('no-motion');render();requestAnimationFrame(()=>requestAnimationFrame(()=>$('boat').classList.remove('no-motion')));message('仲間をタップして、ボートに乗せよう。');window.scrollTo({top:0,behavior:'instant'});$('back').focus({preventScroll:true});}
function home(){closeDialogs();gameOver=false;clearTimeout(timer);busy=false;$('game').hidden=true;$('home').hidden=false;renderCards();window.scrollTo({top:0,behavior:'instant'});}
$('level-cards').onclick=e=>{const c=e.target.closest('[data-level]');if(c){pendingLevel=Number(c.dataset.level);$('mode-level').textContent=`LEVEL ${pendingLevel+1} · ${levels[pendingLevel].title}`;$('mode-dialog').showModal();}};
$('back').onclick=home;document.querySelector('.brand').onclick=e=>{e.preventDefault();home();};$('reset').onclick=()=>start(current);$('next').onclick=()=>current<4?start(current+1):home();
$('cross').onclick=()=>{if(busy||won||gameOver)return;const result=crossRiver(current,positions,side,passengers);if(result.error){invalidAction(result.error);return;}busy=true;message('ゆっくり、向こう岸へ…');render();$('boat').dataset.side=result.side;
timer=setTimeout(()=>{positions=result.positions;side=result.side;moves++;busy=false;won=result.won;if(won){passengers=[];records[current]=Math.min(records[current]||Infinity,moves);try{localStorage.setItem('river-crossing-records',JSON.stringify(records));}catch{}$('success').hidden=false;$('success-text').textContent=`${moves}手でクリア！ ${current===4?'最後の問題も大成功。すべてのレベルに挑戦してみよう。':'すばらしいひらめきです。次の川にも挑戦しよう。'}`;$('next').textContent=current===4?'問題選択へ戻る':'次のレベルへ →';message(`${moves}手でクリアしました！`);$('success').focus({preventScroll:true});$('success').scrollIntoView({behavior:'smooth',block:'nearest'});}else message(`${side?'右岸':'左岸'}に到着！ 仲間を降ろしたり、乗せ替えたりしよう。`);render();},window.matchMedia('(prefers-reduced-motion: reduce)').matches?30:650);};
$('practice-start').onclick=()=>{mode='practice';start(pendingLevel);};
$('challenge-start').onclick=()=>{mode='challenge';start(pendingLevel);};
$('mode-cancel').onclick=()=>$('mode-dialog').close();
$('error-close').onclick=()=>$('error-dialog').close();
$('error-dialog').addEventListener('cancel',e=>{if(gameOver)e.preventDefault();});
$('retry').onclick=()=>start(current);
$('over-home').onclick=home;
renderCards();

// Record one visit per page load without waiting for the response or retrying.
try {
  fetch('https://script.google.com/macros/s/AKfycbxssCIHsD-N97SHxNC_GN0ihYeC0qy-lb-EY0KmSs6Gnztaph1sITMerLVEnNWOGkYc/exec?app=river-crossing-puzzle', {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-store',
    credentials: 'omit',
    keepalive: true,
  }).catch(() => {});
} catch {
  // Access logging must never interrupt the game.
}
