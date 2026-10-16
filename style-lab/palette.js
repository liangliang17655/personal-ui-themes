
const PaletteCore=(()=>{
  function normalize(value){
    if(!value||typeof value!=='object'||!Array.isArray(value.colors)||![2,3].includes(value.colors.length)||!value.colors.every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c))||!['light','dark'].includes(value.mode)||!Number.isFinite(value.angle)||value.angle<0||value.angle>360)return null;
    return {colors:value.colors.map(c=>c.toUpperCase()),mode:value.mode,angle:Math.round(value.angle)};
  }
  function readSaved(raw){try{const v=JSON.parse(raw);return v?.version===1?normalize(v):null}catch{return null}}
  function rgb(c){return [1,3,5].map(i=>parseInt(c.slice(i,i+2),16))}
  function mix(a,b,f){const x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(v*(1-f)+y[i]*f).toString(16).padStart(2,'0')).join('').toUpperCase()}
  function lum(c){const a=rgb(c).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722}
  function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  function readable(color,surfaces,target){
    const score=c=>Math.min(...surfaces.map(s=>contrast(c,s)));
    const end=score('#000000')>score('#FFFFFF')?'#000000':'#FFFFFF';
    for(let i=0;i<=100;i++){const c=mix(color,end,i/100);if(score(c)>=target)return c}return end;
  }
  function generate(input){
    const v=normalize(input);if(!v)throw new TypeError('Invalid palette');
    const [first,second]=v.colors,last=v.colors.at(-1),dark=v.mode==='dark';
    const bg=mix(first,dark?'#0C1420':'#FAFAF8',.94);
    const surface=mix(first,dark?'#172130':'#FFFFFF',.97);
    const muted=mix(first,dark?'#253040':'#F1F2F0',.90);
    const surfaces=[bg,surface,muted];
    const accent=readable(second,[surface],4.5);
    const text=readable(dark?'#F5F7FA':'#1C2530',surfaces,4.5);
    const secondary=readable(dark?'#B5C4D5':'#65717A',surfaces,4.5);
    return {bg,surface,'surface-muted':muted,text,'text-secondary':secondary,accent,'on-accent':readable('#FFFFFF',[accent],4.5),border:mix(text,surface,.78),focus:readable(second,surfaces,3),decor:last,'gradient-decor':`linear-gradient(${v.angle}deg, ${v.colors.join(', ')})`,'chart-1':readable(second,[surface],3),'chart-2':readable(first,[surface],3),'chart-3':readable(last,[surface],3),'surface-immersive':mix(last,dark?'#111C29':'#F2F3EE',.88),'on-immersive':readable(text,[mix(last,dark?'#111C29':'#F2F3EE',.88)],4.5),'shadow':dark?'0 8px 28px rgba(0,0,0,.18)':'0 8px 28px rgba(40,55,40,.06)','shadow-decor':'none'};
  }
  return {normalize,readSaved,generate};
})();

if(typeof module!=="undefined")module.exports=PaletteCore;
