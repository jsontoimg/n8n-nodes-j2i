'use strict';

const assert = require('node:assert/strict');
const {
	extensionForMime,
	previewMime,
	rewriteSignedImgUrl,
} = require('../dist/nodes/Jsontoimg/shared/signedImage.js');

const apiUrl = 'https://app.jsontoimg.com/api/v1';

assert.equal(rewriteSignedImgUrl('https://evil.example/x', apiUrl), null);
assert.equal(rewriteSignedImgUrl('https://app.jsontoimg.com/api/v1/img/tpl1', apiUrl), null);
assert.equal(rewriteSignedImgUrl('not-a-url', apiUrl), null);
assert.equal(
	rewriteSignedImgUrl('https://cdn.example/api/v1/img/tpl1?sig=abc&x=1', apiUrl),
	'https://app.jsontoimg.com/api/v1/img/tpl1?sig=abc&x=1',
);
assert.equal(previewMime('image/jpg'), 'image/jpeg');
assert.equal(previewMime('application/pdf; charset=binary'), 'pdf');
assert.equal(previewMime('text/plain'), null);
assert.equal(extensionForMime('image/png'), 'png');
assert.equal(extensionForMime('pdf'), 'pdf');
