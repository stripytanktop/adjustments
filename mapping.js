(function(){
  const cfg=window.FINDER_MAPPING_DATA||{signals:[],keywordBoosts:{},maxCandidates:6};
  function normalise(text){return String(text||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim()}
  function hasPhrase(text,p){return text.includes(normalise(p))}
  function barrierById(id){return (window.DATA?.barriers||[]).find(b=>b.id===id)}
  function addScore(scores,id,points,reason){if(!barrierById(id))return;let x=scores.get(id)||{id,score:0,reasons:[]};x.score+=points;if(reason&&!x.reasons.includes(reason))x.reasons.push(reason);scores.set(id,x)}
  function mapObservation(input){
    const text=normalise(input), scores=new Map(); if(!text)return[];
    cfg.signals.forEach(sig=>{let hits=sig.phrases.filter(p=>hasPhrase(text,p));if(hits.length){let mult=1+Math.min(.5,(hits.length-1)*.15);Object.entries(sig.barriers).forEach(([id,w])=>addScore(scores,id,w*mult,sig.id))}});
    Object.entries(cfg.keywordBoosts||{}).forEach(([id,words])=>{let n=words.filter(w=>hasPhrase(text,w)).length;if(n)addScore(scores,id,Math.min(4,n*1.25),'word-match')});
    // Context-aware combinations seen in the authentic teacher sample.
    if(/(teacher|adult).*(beside|nearby|support|prompt)/.test(text)&&/(independent|independently|nothing gets done|stay on task|focused)/.test(text)){addScore(scores,'A07',7,'adult-support-context');addScore(scores,'A01',3,'adult-support-context')}
    if(/(knows|understands).*(but|however)/.test(text)&&/(write|paper|record)/.test(text)){addScore(scores,'W02',6,'understanding-vs-recording');addScore(scores,'C03',5,'understanding-vs-recording')}
    if(/(can|able to).*(but|however)/.test(text)&&/(cannot|cant|struggles|difficulty|needs)/.test(text)){scores.forEach(x=>{if(x.reasons.includes('word-match')&&x.score<3)x.score*=.75})}
    if(/(one step|each step)/.test(text)){addScore(scores,'A02',5,'step-sequence');addScore(scores,'A08',4,'step-sequence')}
    if(/(group|class|whole class)/.test(text)&&/(focus|overwhelm|withdraw)/.test(text)){addScore(scores,'S06',5,'environment-context');addScore(scores,'A04',4,'environment-context')}
    return [...scores.values()].filter(x=>x.score>=3).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,cfg.maxCandidates||6).map(x=>({barrier:barrierById(x.id),score:Math.round(x.score*10)/10,reasons:x.reasons}));
  }
  window.FinderMapper={normalise,mapObservation};
})();
