(() => {
'use strict';
const $=id=>document.getElementById(id),stage=$('stage'), reduced=matchMedia('(prefers-reduced-motion: reduce)'), key='personal-ui-style-lab-v1';
let motion=true, themes=[],selectedId='',current=LabModel.preset('spatial'),currentName='都市烟灰',draft,baseline=null,confirmed=false;
const animations=new Set(), fades=new Map();let pointerFrame=0,themeSnapshot=null;
// Keep visual transitions separate from decorative replay animations.
function fade(element,frames,duration,settle=()=>{}) {
 const previous=fades.get(element);if(previous){previous.onfinish=null;previous.cancel();fades.delete(element);}
 if(!motion||reduced.matches){settle();return;}
 const animation=element.animate(frames,{duration,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'});
 fades.set(element,animation);
 animation.onfinish=()=>{if(fades.get(element)!==animation)return;fades.delete(element);settle();animation.cancel();};
}
function captureTheme() {
 if(!motion||reduced.matches)return null;
 if(themeSnapshot){const a=fades.get(themeSnapshot);if(a){a.onfinish=null;a.cancel();fades.delete(themeSnapshot);}themeSnapshot.remove();}
 const copy=stage.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
 copy.querySelectorAll('[for]').forEach(el=>el.removeAttribute('for'));
 copy.classList.add('theme-snapshot');copy.setAttribute('aria-hidden','true');copy.inert=true;
 Object.assign(copy.style,{position:'absolute',left:stage.offsetLeft+'px',top:stage.offsetTop+'px',width:stage.offsetWidth+'px',height:stage.offsetHeight+'px',margin:'0',zIndex:'5',pointerEvents:'none'});
 for(const selector of ['.orb','.orb-shine','.orbit-one','.orbit-two','.glow-a','.glow-b','.leaf-a','.leaf-b']) {
  const source=stage.querySelector(selector),target=copy.querySelector(selector),style=getComputedStyle(source);
  target.style.setProperty('animation','none','important');target.style.transform=style.transform;target.style.opacity=style.opacity;target.style.borderRadius=style.borderRadius;target.style.scale=style.scale;
 }
 stage.parentElement.append(copy);themeSnapshot=copy;return copy;
}

function status(text){$('status').textContent=text;}
function store(){try{localStorage.setItem(key,JSON.stringify({version:1,themes,selectedId}));return true;}catch{status('浏览器未能保存，可能存储已满或被禁用。请导出主题文件保留方案。');return false;}}
try{const raw=localStorage.getItem(key),saved=LabModel.readStore(raw);if(saved){themes=saved.themes;selectedId=saved.selectedId;const active=themes.find(t=>t.id===selectedId);if(active){current=active.config;currentName=active.name;}}else if(raw)status('保存数据无法读取，已回到默认主题。');}catch{status('当前浏览器不允许本机存储，可使用导出主题。');}
const groups=new Map();for(const style of StyleCatalog){if(!groups.has(style.family)){const group=document.createElement('optgroup');group.label=style.family;$('styleSelect').append(group);groups.set(style.family,group);}const option=new Option(style.name,style.id);groups.get(style.family).append(option);}
// Native selects remain the value/event source; the visible picker is shared.
const pickers=new Map();
function makePicker(id,label) {
 const select=$(id),trigger=document.createElement('button'),panel=document.createElement('div');
 trigger.type='button';trigger.id=id+'Trigger';trigger.className='picker-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-label',label);trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',id+'Options');
 panel.id=id+'Options';panel.className='picker-panel'+(id==='styleSelect'?' style-picker':'');panel.setAttribute('role','listbox');panel.setAttribute('aria-label',label);panel.hidden=true;panel.inert=true;
 select.hidden=true;select.after(trigger);$('appearanceDialog').append(panel);
 const fieldLabel=document.querySelector('label[for="'+id+'"]');if(fieldLabel)fieldLabel.htmlFor=trigger.id;
 let open=false,items=[];
 function position(){const r=trigger.getBoundingClientRect(),width=Math.min(innerWidth-24,Math.max(r.width,id==='styleSelect'?320:200));panel.style.width=width+'px';panel.style.left=Math.min(innerWidth-width-12,Math.max(12,r.left))+'px';const below=innerHeight-r.bottom-16,above=r.top-16,up=below<230&&above>below;panel.style.maxHeight=Math.min(480,Math.max(100,up?above:below))+'px';panel.style.top=up?'auto':r.bottom+7+'px';panel.style.bottom=up?innerHeight-r.top+7+'px':'auto';}
 function close(restore=false){if(!open)return;open=false;trigger.setAttribute('aria-expanded','false');panel.inert=true;if(restore)trigger.focus();fade(panel,[{opacity:Number(getComputedStyle(panel).opacity)},{opacity:0}],150,()=>{panel.hidden=true;});}
 function move(index){if(!items.length)return;items[(index+items.length)%items.length].focus();}
 function show(last=false){if(trigger.disabled)return;for(const other of pickers.values())if(other.close!==close)other.close();open=true;render();panel.hidden=false;panel.inert=false;position();trigger.setAttribute('aria-expanded','true');fade(panel,[{opacity:0},{opacity:1}],190);let i=items.findIndex(b=>b.getAttribute('aria-selected')==='true');move(i>=0?i:last?items.length-1:0);}
 function selectValue(value){close(true);select.value=value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));refresh();}
 function render(){panel.replaceChildren();items=[];let lastGroup='';for(const option of select.options){if(option.disabled||(id==='savedSelect'&&!option.value))continue;const group=option.parentElement.tagName==='OPTGROUP'?option.parentElement.label:'';if(group&&group!==lastGroup){const title=document.createElement('div');title.className='picker-group';title.textContent=group;title.setAttribute('role','presentation');panel.append(title);lastGroup=group;}const button=document.createElement('button');button.type='button';button.className='picker-option';button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.value===select.value));button.tabIndex=-1;button.dataset.value=option.value;
 const style=id==='styleSelect'?StyleCatalog.find(x=>x.id===option.value):null;
 if(style){const preview=document.createElement('span');preview.className='picker-preview '+style.id;preview.style.background='linear-gradient(135deg,'+style.presets[0].colors.join(',')+')';preview.setAttribute('aria-hidden','true');preview.append(document.createElement('i'),document.createElement('i'));button.append(preview);}
 const words=document.createElement('span');words.className='picker-words';const name=document.createElement('b');name.textContent=option.textContent;words.append(name);
 if(style){const hint=document.createElement('small');hint.textContent={frosted:'背景柔化 · 虹彩叠层',spatial:'悬浮面板 · 环境光',liquid:'通透胶囊 · 流动高光',frost:'乳白磨砂 · 轻柔层次',natural:'石色暖光 · 自然叶影',soft:'柔软浮雕 · 按压触感',olive:'橄榄暖橙 · 圆弧控件',cockpit:'深色金属 · 仪表扫光'}[style.id];words.append(hint);}
 const check=document.createElement('span');check.className='picker-check';check.textContent='✓';check.setAttribute('aria-hidden','true');button.append(words,check);button.onclick=()=>selectValue(option.value);panel.append(button);items.push(button);}
 }
 function refresh(){const option=select.selectedOptions[0];trigger.replaceChildren();if(id==='styleSelect'){const style=StyleCatalog.find(x=>x.id===select.value);if(style){const dot=document.createElement('span');dot.className='picker-dot';dot.style.background='linear-gradient(135deg,'+style.presets[0].colors.join(',')+')';dot.setAttribute('aria-hidden','true');trigger.append(dot);}}const text=document.createElement('span');text.className='picker-value';text.textContent=option?.textContent||label;const arrow=document.createElement('span');arrow.className='picker-arrow';arrow.setAttribute('aria-hidden','true');trigger.append(text,arrow);trigger.disabled=select.disabled||![...select.options].some(o=>!o.disabled&&(id!=='savedSelect'||o.value));if(open){render();position();}}
 trigger.onclick=()=>open?close():show();
 trigger.onkeydown=event=>{if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();show(event.key==='ArrowUp');}else if(event.key==='Escape')close(true);};
 panel.onkeydown=event=>{const index=items.indexOf(document.activeElement);if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();move(index+(event.key==='ArrowDown'?1:-1));}else if(event.key==='Home'||event.key==='End'){event.preventDefault();move(event.key==='Home'?0:items.length-1);}else if(event.key==='Escape'){event.preventDefault();close(true);}else if(event.key==='Tab'){close(true);}};
 document.addEventListener('pointerdown',event=>{if(!panel.contains(event.target)&&!trigger.contains(event.target))close();});
 window.addEventListener('resize',()=>{if(open)position();});document.addEventListener('scroll',()=>{if(open)position();},true);
 refresh();return {refresh,close};
}
for(const [id,label] of [['styleSelect','设计风格'],['savedSelect','我的主题'],['mode','底色'],['stops','渐变色数']])pickers.set(id,makePicker(id,label));
function animate(element,keyframes,options){if(!motion||reduced.matches)return;const a=element.animate(keyframes,options);animations.add(a);a.onfinish=a.oncancel=()=>animations.delete(a);}
function replay(){for(const a of [...animations])a.cancel();animate(stage.querySelector('.hero-copy'),[{opacity:0},{opacity:1}],{duration:540,easing:'cubic-bezier(.2,.7,.2,1)'});stage.querySelectorAll('.bar-chart i').forEach((el,i)=>animate(el,[{transform:'scaleY(.05)'},{transform:'scaleY(1)'}],{duration:650,delay:i*55,easing:'cubic-bezier(.2,.7,.2,1)'}));animate(stage.querySelector('.gauge-fill'),[{strokeDashoffset:100},{strokeDashoffset:0}],{duration:1100,easing:'cubic-bezier(.2,.7,.2,1)'});}
function updateMotion(){const on=motion&&!reduced.matches;stage.dataset.motion=on?'on':'off';document.documentElement.dataset.labMotion=on?'on':'off';$('motionToggle').textContent=reduced.matches?'系统减少动效':on?'动效已开启':'动效已关闭';$('motionToggle').setAttribute('aria-pressed',String(on));$('replay').disabled=!on;if(!on){for(const a of [...fades.values()])a.finish();for(const a of [...animations])a.cancel();if(pointerFrame)cancelAnimationFrame(pointerFrame);pointerFrame=0;stage.style.removeProperty('--mx');stage.style.removeProperty('--my');}}
function setTokens(config){const t=PaletteCore.generate(config);const map={bg:'bg',surface:'surface',muted:'surface-muted',text:'text',secondary:'text-secondary',accent:'accent','on-accent':'on-accent',decor:'decor',chart1:'chart-1',chart2:'chart-2'};for(const [css,token] of Object.entries(map))stage.style.setProperty('--'+css,t[token]);config.colors.forEach((c,i)=>stage.style.setProperty('--g'+(i+1),c));if(config.colors.length===2)stage.style.setProperty('--g3',config.colors[1]);for(const [css,value] of Object.entries({angle:config.angle+'deg',glass:config.glass/100,blur:config.blur+'px',radius:config.round+'px'}))stage.style.setProperty('--'+css,value);stage.style.colorScheme=config.mode;document.body.style.setProperty('--lab-page-bg',t.bg);
 const appearance=$('appearanceDialog');appearance.dataset.style=config.styleId;for(const [css,token]of Object.entries(map))appearance.style.setProperty('--'+css,t[token]);appearance.style.setProperty('--blur',config.blur+'px');appearance.style.colorScheme=config.mode;

 const dialog=$('profileDialog');dialog.dataset.style=config.styleId;dialog.style.setProperty('--blur',config.blur+'px');for(const [css,token] of Object.entries(map))dialog.style.setProperty('--'+css,t[token]);for(const [css,token]of Object.entries({surface:'surface',text:'text',accent:'accent','on-accent':'on-accent'}))dialog.style.setProperty('--'+css,t[token]);dialog.style.colorScheme=config.mode;
}
function renderPresets(){const style=StyleCatalog.find(s=>s.id===current.styleId);$('presets').replaceChildren();style.presets.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='preset';b.setAttribute('aria-pressed',String(!selectedId && LabModel.same(current,LabModel.preset(style.id,i))));const swatch=document.createElement('span');swatch.className='swatch';swatch.style.background=`linear-gradient(135deg,${p.colors.join(',')})`;swatch.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=p.name;const check=document.createElement('span');check.className='check';check.textContent='✓';b.append(swatch,label,check);b.onclick=()=>chooseDefault(style.id,i);$('presets').append(b);});}
function renderSaved(){const select=$('savedSelect');select.replaceChildren(new Option(themes.length?'选择已保存主题':'暂无保存的主题',''));for(const t of themes){const style=StyleCatalog.find(s=>s.id===t.config.styleId);select.add(new Option(t.name+' · '+style.name,t.id));}select.value=selectedId;pickers.get('savedSelect').refresh();$('deleteTheme').disabled=!selectedId;}
function apply(config,name,{play=true}={}){const snapshot=play?captureTheme():null;current=LabModel.normalize(config);currentName=name;const style=StyleCatalog.find(s=>s.id===current.styleId);stage.dataset.style=current.styleId;$('styleSelect').value=style.id;pickers.get('styleSelect').refresh();$('familyName').textContent=style.family;$('styleName').textContent=style.name;const titleParts=style.title.split('，');$('heroTitle').replaceChildren(...titleParts.map((part,i)=>Object.assign(document.createElement('span'),{textContent:part+(i<titleParts.length-1?'，':'')})));$('heroDesc').textContent=style.description;$('styleHint').textContent=style.description;$('motionName').textContent=style.motion;$('themeLabel').textContent=name;setTokens(current);renderPresets();renderSaved();if(snapshot)fade(snapshot,[{opacity:1},{opacity:0}],420,()=>{snapshot.remove();if(themeSnapshot===snapshot)themeSnapshot=null;});}
function refreshSave(){const valid=confirmed&&LabModel.same(draft,current);$('saveTheme').disabled=!valid;}
function syncEditor(){draft=LabModel.clone(current);for(let i=0;i<3;i++)$('color'+i).value=draft.colors[i]||draft.colors[1];$('stops').value=String(draft.colors.length);$('mode').value=draft.mode;for(const id of ['angle','glass','blur','round'])$(id).value=draft[id];$('themeName').value='';confirmed=false;pickers.get('mode').refresh();pickers.get('stops').refresh();updateDraft();}
function updateDraft(){draft={styleId:current.styleId,colors:Array.from({length:Number($('stops').value)},(_,i)=>$('color'+i).value),mode:$('mode').value,angle:Number($('angle').value),glass:Number($('glass').value),blur:Number($('blur').value),round:Number($('round').value)};$('color2').disabled=draft.colors.length===2;const t=PaletteCore.generate(draft),sample=$('draftSample');sample.style.setProperty('--sample-bg',t.surface);sample.style.setProperty('--sample-text',t.text);sample.style.setProperty('--sample-gradient',t['gradient-decor']);for(const [id,suffix]of [['angle','°'],['glass','%'],['blur','px'],['round','px']])$(id+'Value').textContent=draft[id]+suffix;refreshSave();}
function chooseDefault(id,index=0){selectedId='';baseline=null;confirmed=false;const style=StyleCatalog.find(s=>s.id===id);apply(LabModel.preset(id,index),style.presets[index].name);syncEditor();status('已切换至'+style.name+' / '+currentName+'，默认主题保持原样。');}
$('styleSelect').onchange=()=>chooseDefault($('styleSelect').value);
$('editToggle').onclick=()=>{
 const editor=$('editor'),open=$('editToggle').getAttribute('aria-expanded')!=='true';
 const height=editor.hidden?0:editor.getBoundingClientRect().height,opacity=editor.hidden?0:Number(getComputedStyle(editor).opacity);
 editor.hidden=false;editor.inert=!open;editor.style.overflow='hidden';
 $('editToggle').setAttribute('aria-expanded',String(open));$('editToggle').querySelector('span').textContent=open?'−':'＋';
 fade(editor,[{height:height+'px',opacity},{height:(open?editor.scrollHeight:0)+'px',opacity:open?1:0}],320,()=>{editor.hidden=!open;editor.inert=!open;editor.style.removeProperty('overflow');});
};
for(const id of ['color0','color1','color2','mode','stops','angle','glass','blur','round'])$(id).addEventListener('input',updateDraft);
$('editor').onsubmit=event=>{event.preventDefault();updateDraft();if(!baseline)baseline={config:LabModel.clone(current),name:currentName,selectedId};selectedId='';apply(draft,'自定义 · 预览中');confirmed=true;refreshSave();status('整页预览已应用。满意后填写名称并保存，也可以取消预览。');};
$('cancelPreview').onclick=()=>{if(baseline){const old=baseline;selectedId=old.selectedId;baseline=null;apply(old.config,old.name);}syncEditor();status('已取消自定义预览，回到预览前的主题。');};
function save(name,config){if(themes.length>=30){status('已保存 30 套主题。请先导出或删除不需要的方案。');return false;}const oldId=selectedId;const theme={id:crypto.randomUUID(),name,config:LabModel.normalize(config)};themes.push(theme);selectedId=theme.id;if(!store()){themes.pop();selectedId=oldId;return false;}baseline=null;confirmed=false;apply(theme.config,theme.name);syncEditor();status('已保存“'+theme.name+'”。刷新可恢复，可继续创建其他主题。');return true;}
$('saveTheme').onclick=()=>{updateDraft();if(!confirmed||!LabModel.same(draft,current))return;const name=$('themeName').value.trim();if(!name){status('先为这套主题起个名字。');$('themeName').focus();return;}save(name,current);};
$('savedSelect').onchange=()=>{const saved=themes.find(t=>t.id===$('savedSelect').value);if(!saved)return;selectedId=saved.id;baseline=null;apply(saved.config,saved.name);syncEditor();if(store())status('已应用保存的主题：'+saved.name);};
$('deleteTheme').onclick=()=>{if(!selectedId)return;if(!confirm('删除当前本机主题？默认主题不受影响。建议先导出需要保留的方案。'))return;const old=themes,oldId=selectedId;themes=themes.filter(t=>t.id!==selectedId);selectedId='';if(!store()){themes=old;selectedId=oldId;return;}chooseDefault(current.styleId);status('已从本机移除主题，默认主题保持不变。');};
$('exportTheme').onclick=()=>{const blob=new Blob([LabModel.serializeTheme(currentName,current)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='personal-ui-theme.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('已导出当前主题配置，可在其他设备导入。');};
$('importTheme').onclick=()=>$('importFile').click();$('importFile').onchange=async()=>{const file=$('importFile').files[0];$('importFile').value='';if(!file)return;if(file.size>64000){status('文件过大，请选择本工具导出的主题 JSON 文件。');return;}try{const v=LabModel.readImport(await file.text());if(!v){status('主题文件格式或参数不正确，当前主题未改变。');return;}save(v.name,v.config);}catch{status('无法读取文件，请重新选择主题 JSON 文件。');}};
$('motionToggle').onclick=()=>{motion=!motion;updateMotion();};reduced.addEventListener('change',updateMotion);$('replay').onclick=replay;
stage.addEventListener('pointermove',e=>{if(!motion||reduced.matches||e.pointerType!=='mouse'||pointerFrame)return;pointerFrame=requestAnimationFrame(()=>{const r=stage.getBoundingClientRect();stage.style.setProperty('--mx',(e.clientX-r.left)+'px');stage.style.setProperty('--my',(e.clientY-r.top)+'px');pointerFrame=0;});});
stage.addEventListener('pointerleave',()=>{stage.style.removeProperty('--mx');stage.style.removeProperty('--my');});
$('temperature').oninput=()=>{const n=Number($('temperature').value);$('comfortValue').replaceChildren(document.createTextNode(String(n)),Object.assign(document.createElement('small'),{textContent:'°'}));$('temperatureLabel').textContent=n+'°C';stage.style.setProperty('--progress',String((n-16)/16*75+20));};
$('deviceSwitch').onclick=()=>{const b=$('deviceSwitch');b.setAttribute('aria-checked',String(b.getAttribute('aria-checked')!=='true'));};
for(const checkbox of stage.querySelectorAll('.todo input'))checkbox.onchange=()=>{$('doneCount').textContent=stage.querySelectorAll('.todo input:checked').length+' / 3';};
for(const button of stage.querySelectorAll('[data-view]'))button.onclick=()=>{stage.querySelectorAll('[data-view]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});const captions={today:'一个空间，安放日常。',space:'调节温度、切换模式，试试控件的手感。',plan:'勾选今天的小计划，写一句自己的小记。'};$('viewLabel').textContent=captions[button.dataset.view];const target=button.dataset.view==='plan'?'.plan-panel':button.dataset.view==='space'?'.comfort-panel':'.hero';animate(stage.querySelector(target),[{opacity:.45},{opacity:1}],{duration:380});};
let focusMode=false;$('sceneButton').onclick=()=>{focusMode=!focusMode;$('sceneButton').replaceChildren(document.createTextNode(focusMode?'结束专注':'开启专注'),Object.assign(document.createElement('span'),{textContent:'↗'}));animate(stage.querySelector('.orb'),[{scale:1},{scale:1.1},{scale:1}],{duration:700,easing:'ease-in-out'});status(focusMode?'专注已开启。这是效果演示，不会启动系统计时器。':'专注已结束。');};
function openDialog(text){const dialog=$('profileDialog');$('dialogText').textContent=text;delete dialog.dataset.closing;if(!dialog.open)dialog.showModal();fade(dialog,[{opacity:0},{opacity:1}],280);}
function closeDialog(){const dialog=$('profileDialog');if(!dialog.open)return;dialog.dataset.closing='true';fade(dialog,[{opacity:Number(getComputedStyle(dialog).opacity)},{opacity:0}],240,()=>{dialog.close();delete dialog.dataset.closing;});}
$('profileDialog').querySelector('form').addEventListener('submit',event=>{event.preventDefault();closeDialog();});
$('profileDialog').addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
$('openDialog').onclick=()=>openDialog('这里展示当前风格下的弹窗、按钮和输入框。');$('chartDetail').onclick=()=>openDialog('本周专注 18.5 小时，比上周多 2.3 小时。此处数据仅用于展示图表样式。');
document.addEventListener('visibilitychange',()=>{stage.querySelectorAll('.ambient *, .sculpture *').forEach(el=>el.style.animationPlayState=document.hidden?'paused':'');});
const settingsToggle=$('settingsToggle'),appearanceDialog=$('appearanceDialog');
function closeAppearance(){
 for(const picker of pickers.values())picker.close();
 appearanceDialog.close();
 settingsToggle.setAttribute('aria-expanded','false');
 settingsToggle.focus();
}
settingsToggle.onclick=()=>{
 appearanceDialog.showModal();
 settingsToggle.setAttribute('aria-expanded','true');
 fade($('appearanceSettings'),[{opacity:0},{opacity:1}],220);
};
$('closeAppearance').onclick=closeAppearance;
$('doneAppearance').onclick=closeAppearance;
appearanceDialog.addEventListener('cancel',event=>{event.preventDefault();closeAppearance();});
appearanceDialog.addEventListener('click',event=>{
 if(event.target!==appearanceDialog)return;
 const r=appearanceDialog.getBoundingClientRect();
 if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeAppearance();
});
updateMotion();apply(current,currentName,{play:false});syncEditor();replay();
})();
