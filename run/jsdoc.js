'use strict';

const fs = require('fs-extra');
const jsdoc2md = require('jsdoc-to-markdown');

const delimitStrStart = '<!-- START jsdoc-to-markdown GENERATED API DOC -->';
const delimitStrStop = '<!-- STOP jsdoc-to-markdown GENERATED API DOC -->';
const regexStr = delimitStrStart + '[\\S\\s]*' + delimitStrStop;
const regex = new RegExp(regexStr);

let md = jsdoc2md.renderSync({files: ['./index.js']});
md = md.replace(/<code><\/code>/g, '<code>null</code>');
md = md.replace(/\*\*Kind\*\*: global function/g, '**Kind**: exported function');

let readme = fs.readFileSync('./README.md', 'utf8');
readme = readme.replace(regex, delimitStrStart + '\n\n' + md + delimitStrStop);

fs.writeFileSync('./README.md', readme);
