const person = (id, name, emoji, group = '') => ({ id, name, emoji, group });
const farmer = person('farmer', '農夫', '🧑‍🌾');
export const levels = [
  { title: '農夫と2つの荷物', description: 'まずはここから。ボートの操作を覚えよう。', icons: '🧑‍🌾 🍎 🎃', people: [farmer, person('apple','リンゴ','🍎'),person('pumpkin','カボチャ','🎃')], drivers:['farmer'], rules:['ボートには農夫と荷物1つまで乗れます。','ボートを動かせるのは農夫だけです。','荷物どうしを一緒に残しても大丈夫です。'] },
  { title:'狼・ヤギ・キャベツ', description:'食べられちゃう、その前に。順番がカギ！', icons:'🐺 🐐 🥬', people:[farmer,person('wolf','狼','🐺'),person('goat','ヤギ','🐐'),person('cabbage','キャベツ','🥬')], drivers:['farmer'], rules:['ボートには農夫と1匹（1つ）まで乗れます。','ボートを動かせるのは農夫だけ。1人でも渡れます。','農夫がいない岸で、狼とヤギを一緒にできません。','農夫がいない岸で、ヤギとキャベツを一緒にできません。'] },
  { title:'3組の夫婦',description:'3組のペアで協力。お留守番の組み合わせは？',icons:'👨 👩 💛',people:['A','B','C'].flatMap(g=>[person('h'+g,'夫'+g,'👨',g),person('w'+g,'妻'+g,'👩',g)]),rules:['ボートの定員は2人。1人でも渡れます。','夫・妻の誰でもボートを操作できます。','どの妻も、自分の夫がいない岸で他の夫と一緒にいられません。','条件は左右両方の岸で確認します。'] },
  { title:'宣教師と人食い人種',description:'人数のバランスを保って、全員で渡ろう。',icons:'🧑‍🏫 🧑‍🍳 🚣',people:[1,2,3].map(n=>person('m'+n,'宣教師','🧑‍🏫','missionary')).concat([1,2,3].map(n=>person('c'+n,'人食い人種','🧑‍🍳','cannibal'))),rules:['ボートの定員は2人。1人でも渡れます。','全員がボートを操作できます。','宣教師が1人以上いる岸では、人食い人種の人数が宣教師を上回ってはいけません。','条件は左右両方の岸で確認します。'] },
  { title:'大家族と犬',description:'家族も犬もお忘れなく。最後の大冒険！',icons:'👨 👩 🐕',people:[person('father','父','👨'),person('mother','母','👩'),person('son1','息子1','👦'),person('son2','息子2','👦'),person('daughter1','娘1','👧'),person('daughter2','娘2','👧'),person('maid','メイド','🧑‍💼'),person('dog','犬','🐕')],drivers:['father','mother','maid'],rules:['ボートの定員は2人。犬も1人分として数えます。','操作できるのは父・母・メイドだけです。','父は、母がいない岸で娘と一緒にいられません。','母は、父がいない岸で息子と一緒にいられません。','犬は、メイドがいない岸で家族と一緒にいられません。','犬はメイドと一緒なら移動できます。両岸で条件を確認します。'] }
];
export function bankError(level, ids) {
 const s = new Set(ids), has = id => s.has(id);
 if(level===1 && !has('farmer')) {
  if(has('wolf')&&has('goat')) return '狼がヤギを食べてしまいます！';
  if(has('goat')&&has('cabbage')) return 'ヤギがキャベツを食べてしまいます！';
 }
 if(level===2) for(const g of ['A','B','C']) if(has('w'+g)&&!has('h'+g)&&['A','B','C'].some(other=>other!==g&&has('h'+other))) return `妻${g}が、自分の夫がいない岸で他の夫と一緒になってしまいます！`;
 if(level===3) {const m=ids.filter(id=>id.startsWith('m')).length,c=ids.filter(id=>id.startsWith('c')).length;if(m>0&&c>m)return `人食い人種${c}人が宣教師${m}人より多くなってしまいます！`;}
 if(level===4) {
  if(has('father')&&!has('mother')&&(has('daughter1')||has('daughter2')))return '母がいない岸で、父と娘が一緒になってしまいます！';
  if(has('mother')&&!has('father')&&(has('son1')||has('son2')))return '父がいない岸で、母と息子が一緒になってしまいます！';
  if(has('dog')&&!has('maid')&&ids.some(id=>!['dog','maid'].includes(id)))return 'メイドがいない岸で、犬と家族が一緒になってしまいます！';
 }
 return '';
}
export function crossRiver(level, positions, side, passengers) {
 const data=levels[level];
 if(!passengers.length)return {error:'まずは仲間をボートに乗せてください。'};
 if(passengers.length>2)return {error:'ボートの定員は2人（荷物・犬を含む）です。'};
 if(new Set(passengers).size!==passengers.length||passengers.some(id=>positions[id]!==side))return {error:'ボートと同じ岸にいる仲間を選んでください。'};
 if(data.drivers&&!passengers.some(id=>data.drivers.includes(id)))return {error:level===4?'父・母・メイドの誰かが乗らないと、ボートを動かせません。':'農夫が乗らないと、ボートを動かせません。'};
 const next={...positions};for(const id of passengers)next[id]=1-side;
 for(const shore of [0,1]) {const error=bankError(level,data.people.filter(p=>next[p.id]===shore).map(p=>p.id));if(error)return {error:`${shore===0?'左岸':'右岸'}：${error}`};}
 return {positions:next,side:1-side,won:data.people.every(p=>next[p.id]===1)};
}
export function initialPositions(level){return Object.fromEntries(levels[level].people.map(p=>[p.id,0]));}
