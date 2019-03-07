'use strict';

const fs = require('fs');
const path = require('path');

const jsdoc2md = require('jsdoc-to-markdown');

const delimitStrStart = '<!-- START jsdoc-to-markdown GENERATED API DOC -->';
const delimitStrStop = '<!-- STOP jsdoc-to-markdown GENERATED API DOC -->';
const regexStr = delimitStrStart + '[\\S\\s]*' + delimitStrStop;
const regex = new RegExp(regexStr);

let md = jsdoc2md.renderSync({files: [path.join(__dirname, '..', 'index.js')]});
md = md.replace(/<code><\/code>/g, '<code>null</code>');
md = md.replace(/\*\*Kind\*\*: global function/g, '**Kind**: exported function');

const readmeFile = path.join(__dirname, '..', 'README.md');
let readmeContent = fs.readFileSync(readmeFile, 'utf8');
readmeContent = readmeContent.replace(regex, delimitStrStart + '\n\n' + md + delimitStrStop);

fs.writeFileSync(readmeFile, readmeContent);
