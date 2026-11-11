const assert = require('node:assert/strict');
const { test } = require('node:test');

test('only supported canonical reading destinations become shared resources', async () => {
 const { sharedReading } = await import('../../js/commons-content.js');
 const root = new URL('../../', 'file:///' + __filename.replaceAll('\\','/'));
 const message = path => 'Read this with me.\nReading: https://homegroups.example/' + path;
 assert.equal(sharedReading(message('?card=scriptureapi&ref=John+1%3A5')),null);
 assert.equal(sharedReading('ordinary text with <<<<<<< in it'),null);
 // The module validates the same-origin form. Run its parser with an HTTPS module base.
 const fs = require('node:fs');
 const vm = require('node:vm');
 const source = fs.readFileSync(new URL('js/commons-content.js',root),'utf8')
  .replace(/^import .*$/gm,'').replace('import.meta.url', "'https://homegroups.example/js/commons-content.js'")
  .replaceAll('export function','function');
 const parser = vm.runInNewContext(source+'\nsharedReading',{URL,URLSearchParams,BOOK_MAP:{john:'JHN'},discussionReading:()=>null});
 assert.equal(parser(message('?card=scriptureapi&ref=John+1%3A5&version=NASB&post=private')).url.search,'?card=scriptureapi&ref=John+1%3A5&version=NASB');
 assert.equal(parser(message('?card=scriptureapi&ref=Unknown+1')),null);
 assert.equal(parser(message('?card=scriptureapi&ref=John+0')),null);
 assert.equal(parser(message('?card=fellowship-live&post=private')),null);
});
