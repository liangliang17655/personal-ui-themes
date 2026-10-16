const LabModel = (() => {
 const palette = typeof PaletteCore !== 'undefined' ? PaletteCore : require('./palette.js');
 const catalog = typeof StyleCatalog !== 'undefined' ? StyleCatalog : require('../skills/personal-ui-themes/assets/style-presets.js');
 const clone = value => JSON.parse(JSON.stringify(value));
 function normalize(input) {
  if (!input || typeof input !== 'object' || !catalog.some(s => s.id === input.styleId)) return null;
  const colors = palette.normalize(input); if (!colors) return null;
  for (const [key,min,max] of [['glass',72,98],['blur',0,24],['round',12,36]]) if (!Number.isFinite(input[key]) || input[key] < min || input[key] > max) return null;
  return {...colors,styleId:input.styleId,glass:Math.round(input.glass),blur:Math.round(input.blur),round:Math.round(input.round)};
 }
 function preset(styleId, index=0) {
  const style=catalog.find(s=>s.id===styleId) || catalog[0];
  const v=style.presets[index] || style.presets[0];
  return {...clone(v), styleId:style.id,glass:style.id==='frosted'?72:style.id==='soft'?98:88,blur:style.id==='frosted'?24:style.id==='cockpit'?8:16,round:style.id==='liquid'?32:24};
 }
 function readTheme(input) {
  if(!input || typeof input.id!=='string' || !/^[a-zA-Z0-9-]{1,80}$/.test(input.id) || typeof input.name!=='string' || !input.name.trim() || input.name.length>30)return null;
  const config=normalize(input.config);return config?{id:input.id,name:input.name.trim(),config}:null;
 }
 function readStore(raw) {
  try {const v=JSON.parse(raw);if(v?.version!==1||!Array.isArray(v.themes)||v.themes.length>30)return null;
   const themes=v.themes.map(readTheme);if(themes.some(x=>!x)||new Set(themes.map(x=>x.id)).size!==themes.length)return null;
   return {version:1,themes,selectedId:themes.some(t=>t.id===v.selectedId)?v.selectedId:''};
  } catch {return null;}
 }
 function readImport(raw) {try {const v=JSON.parse(raw);if(v?.version!==1 || v.kind!=='personal-ui-theme')return null;const config=normalize(v.config);if(!config||typeof v.name!=='string'||!v.name.trim()||v.name.length>30)return null;return {name:v.name.trim(),config};}catch{return null;}}
 function serializeTheme(name,config) {const v=normalize(config);if(!v)throw new TypeError('Invalid theme');return JSON.stringify({kind:'personal-ui-theme',version:1,name:name.slice(0,30),config:v},null,2);}
 function same(a,b){return JSON.stringify(normalize(a))===JSON.stringify(normalize(b));}
 return {normalize,preset,readStore,readImport,serializeTheme,same,clone};
})();
if(typeof module!=='undefined')module.exports=LabModel;
