(function(){
  function cfg(){return window.FINDER_MAPPING_DATA||{signals:[],keywordBoosts:{},maxCandidates:6}}
  function normalise(text){return String(text||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim()}
  function has(text,term){return text.includes(normalise(term))}
  function barrierById(id){return (window.DATA?.barriers||[]).find(b=>b.id===id)}
  function add(scores,id,points,reason){if(!barrierById(id)||points<=0)return;let x=scores.get(id)||{id,score:0,reasons:[]};x.score+=points;if(reason&&!x.reasons.includes(reason))x.reasons.push(reason);scores.set(id,x)}
  function mapObservation(input){
    const text=normalise(input), scores=new Map(), C=cfg(); if(!text)return[];
    const hasAny=(arr)=>arr.some(x=>has(text,x));
    const focus=hasAny(['focus','focused','focusing','concentrate','concentration','attention']);
    const start=hasAny(['start','started','starting','begin','begun','get going']);
    const adult=hasAny(['adult','teacher','beside','nearby','prompt','prompts','prompting','reminder','reminders','support']);
    const routine=hasAny(['routine','routines','familiar activity','familiar task','known task']);
    const writing=hasAny(['write','writing','written','paper','record','recording']);
    const ideas=hasAny(['ideas','idea','knows the answer','know the answer']);
    const pageLoad=hasAny(['page','large amounts of text','too much information','visually busy']);
    const repeat=hasAny(['repeat','repeated','again','multiple times']);
    const sound=hasAny(['sound','sounds','noise','noisy','heard','hear']);
    const visual=hasAny(['see','visual','visually','written on the board']);
    const active=hasAny(['physically do','manipulate','manipulating','hands on','hands-on','act it out','write it']);
    if(focus)add(scores,'A04',8,'focus-anchor');
    if(hasAny(['distracted','distraction']))add(scores,'A04',7,'distracted-anchor');
    if(start&&!pageLoad)add(scores,'A01',6,'start-anchor');
    if(hasAny(['instructions','directions']))add(scores,'A03',3.5,'instructions-anchor');
    if(hasAny(['remember','forget','forgets','forgot']))add(scores,'A02',6,'memory-anchor');
    if(hasAny(['noise','noisy','sounds']))add(scores,'S01',7,'sound-anchor');
    if(hasAny(['change','unexpected','routine']))add(scores,'T03',4,'change-anchor');
    if(hasAny(['overwhelmed','too much information']))add(scores,'A05',4,'overload-anchor');
    C.signals.forEach(sig=>{const hits=sig.phrases.filter(p=>has(text,p));if(!hits.length)return;let mult=1+Math.min(.45,(hits.length-1)*.15);Object.entries(sig.barriers).forEach(([id,w])=>add(scores,id,w*mult,sig.id))});
    Object.entries(C.keywordBoosts||{}).forEach(([id,words])=>{let n=words.filter(w=>has(text,w)).length;if(n)add(scores,id,Math.min(3.5,n*1.15),'word-match')});
    if(adult&&hasAny(['independent','independently','nothing gets done','stay on task','focused','engaged'])){add(scores,'A07',7,'adult-support-context');if(start)add(scores,'A01',3,'adult-support-context')}
    if(adult&&routine)add(scores,'T04',7,'adult-plus-routine');
    if(!(adult&&routine))scores.delete('T04');
    if(writing&&ideas){add(scores,'W02',7,'understanding-vs-recording');add(scores,'C03',6,'understanding-vs-recording');add(scores,'C04',5,'understanding-vs-recording')}
    if(!(writing&&start))scores.delete('W01');
    if(pageLoad){add(scores,'R03',8,'page-load-context');add(scores,'S02',5,'page-load-context');add(scores,'A05',4,'page-load-context');scores.delete('A01')}
    if(sound)add(scores,'S01',4,'auditory-context');
    if(visual&&sound)add(scores,'C06',7,'spoken-plus-visual');
    if(active){add(scores,'C06',3,'active-access');add(scores,'R06',5,'active-access')}
    if(!repeat)scores.delete('A03');
    if(hasAny(['own thoughts']))add(scores,'A04',4,'internal-distraction');
    if(hasAny(['movement'])&&hasAny(['distracted','distraction']))add(scores,'S02',4,'movement-distraction');
    if(!adult)scores.delete('A07');
    return [...scores.values()].filter(x=>x.score>=4).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,C.maxCandidates||6).map(x=>({barrier:barrierById(x.id),score:Math.round(x.score*10)/10,reasons:x.reasons}));
  }
  window.FinderMapper={normalise,mapObservation};
})();
