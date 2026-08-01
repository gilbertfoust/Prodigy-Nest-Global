export type SkillMetric = { accuracy:number; retention:number; speed:number; attempts:number };
export type LanguageProfile = { id:string; name:string; flag:string; cefr:string; tsiStage:number; coverage:number; streak:number; speaking:number; listening:number; reading:number; patterns:number; weakFamilies:string[] };

export const tsiStages = [
  {name:'Positive Transfer',weight:15},
  {name:'Frequency-Based Lexicon',weight:25},
  {name:'Functional Grammar',weight:25},
  {name:'Task-Based Application',weight:20},
  {name:'Scaffolded Immersion',weight:15}
];

export const partsOfSpeech = [
  ['Interjections',18],['Articles & Determiners',22],['Pronouns',35],['Nouns',250],['Adjectives',120],['Verbs',180],['Adverbs',85],['Prepositions',45],['Conjunctions',32]
].map(([name,target],i)=>({phase:i+1,name:String(name),target:Number(target),mastery:[82,76,69,61,54,47,39,31,18][i]}));

export const patternFamilies = ['Identity & description','Possession','Existence','Negation','Questions','Requests','Permission','Obligation','Ability','Intention','Preference','Comparison','Quantity','Location','Direction','Time','Frequency','Cause & effect','Conditions','Sequencing','Narration','Politeness','Clarification','Conversational repair','Agreement & disagreement','Topic transition','Register change'];

export const languages:LanguageProfile[] = [
  {id:'ja',name:'Japanese',flag:'🇯🇵',cefr:'A2',tsiStage:3,coverage:38,streak:11,speaking:66,listening:72,reading:58,patterns:41,weakFamilies:['Counters','Particles','Polite requests']},
  {id:'es',name:'Spanish',flag:'🇪🇸',cefr:'B1',tsiStage:4,coverage:57,streak:19,speaking:78,listening:81,reading:84,patterns:68,weakFamilies:['Past narration','Object pronouns']},
  {id:'fr',name:'French',flag:'🇫🇷',cefr:'A2',tsiStage:3,coverage:44,streak:7,speaking:63,listening:69,reading:76,patterns:52,weakFamilies:['Liaison','Partitives']}
];

export function efficiency(m:SkillMetric){
  const quality=(m.accuracy*.45+m.retention*.35+m.speed*.20);
  const fatigue=Math.max(0,(m.attempts-12)*1.4);
  return Math.max(0,Math.min(100,Math.round(quality-fatigue)));
}

export function recommendation(p:LanguageProfile){
  const lowest=[['Speaking',p.speaking],['Listening',p.listening],['Reading',p.reading],['Pattern recall',p.patterns]].sort((a,b)=>Number(a[1])-Number(b[1]))[0][0];
  const room=lowest==='Speaking'?'Speaker Studio':lowest==='Listening'?'Conversation Atrium':lowest==='Reading'?'Reader Library':'Pattern Laboratory';
  return {focus:lowest,room,reason:`${lowest} is currently the lowest measured skill. Practise ${p.weakFamilies[0]} through short retrieval cycles before entering free conversation.`};
}
