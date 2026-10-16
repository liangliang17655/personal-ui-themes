const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const core = html.match(/\/\/ palette-core:start([\s\S]*?)\/\/ palette-core:end/);
test('self-contained demo exposes its real palette generator for validation', () => {
  assert.ok(core, 'Custom palette generator is not implemented yet');
});
if (core) {
  const api = vm.runInNewContext(core[1] + '\nPaletteCore;');
  function luminance(hex) {
    const rgb = hex.match(/[a-f\d]{2}/gi).map(c => parseInt(c, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  }
  function contrast(a, b) {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  }
  test('generated text and charts remain legible for extremes and varied custom palettes', () => {
    for (const colors of [['#FFFFFF','#FFFFFF'],['#000000','#000000'],['#FF0000','#00FF00','#0000FF'],['#EEEEEE','#FFFF00'],['#42634A','#97B28D','#E8E6D5']]) {
      for (const mode of ['light','dark']) {
        const t = api.generate({colors, mode, angle:145});
        for (const surface of ['bg','surface','surface-muted']) {
          for (const text of ['text','text-secondary']) assert.ok(contrast(t[text],t[surface]) >= 4.5, `${text}/${surface} ${colors} ${mode}`);
        }
        assert.ok(contrast(t['on-accent'],t.accent)>=4.5);
        assert.ok(contrast(t['on-immersive'],t['surface-immersive'])>=4.5);
        for (const chart of ['chart-1','chart-2','chart-3']) assert.ok(contrast(t[chart],t.surface)>=3, `${chart} ${mode}`);
        assert.ok(contrast(t.focus,t.bg)>=3);
      }
    }
  });
  test('gradient preserves the chosen stop order and direction', () => {
    const t=api.generate({colors:['#ff0000','#00FF00','#0000ff'],mode:'dark',angle:270});
    assert.equal(t['gradient-decor'],'linear-gradient(270deg, #FF0000, #00FF00, #0000FF)');
    assert.equal(api.generate({colors:['#FFFFFF','#000000'],mode:'light',angle:0})['gradient-decor'],'linear-gradient(0deg, #FFFFFF, #000000)');
  });
  test('rejects malformed or unsafe persisted palettes without applying arbitrary CSS', () => {
    for (const raw of [null,'','{}','invalid','null',JSON.stringify({version:2,colors:['#000000','#FFFFFF'],mode:'light',angle:0}),JSON.stringify({version:1,colors:['#FFFFFF; color:red','#000000'],mode:'light',angle:0}),JSON.stringify({version:1,colors:['#FFFFFF','#000000'],mode:'light',angle:999})]) assert.equal(api.readSaved(raw),null);
    for(const input of [{colors:['red','#FFFFFF'],mode:'light',angle:0},{colors:['#000000'],mode:'light',angle:0},{colors:['#000000','#FFFFFF'],mode:'auto',angle:0},{colors:['#000000','#FFFFFF'],mode:'light',angle:NaN}]) assert.equal(api.normalize(input),null);
  });
  test('saved two- and three-color palettes round-trip without unrelated fields', () => {
    for (const colors of [['#112233','#DDEEFF'],['#112233','#445566','#DDEEFF']]) {
      const stored={version:1,colors,mode:'light',angle:360,unexpected:'ignore me'};
      const restored=api.readSaved(JSON.stringify(stored));
      assert.equal(restored.colors.join(','),colors.join(','));
      assert.equal(restored.angle,360);assert.equal(restored.mode,'light');
      assert.equal(restored.unexpected,undefined);
    }
  });
}
