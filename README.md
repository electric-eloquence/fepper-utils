# Fepper Utilities

If you are creating a Fepper extension:

```shell
npm install --save fepper-utils
```

Then, require in your JavaScript:

```javascript
const utils = require('fepper-utils');
const property = utils.deepGet(obj, 'path.to.nested.property');
```

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN `npm run jsdoc` TO UPDATE -->
<!-- START jsdoc-to-markdown GENERATED API DOC -->

## Functions

<dl>
<dt><a href="#t">t(key)</a> ⇒ <code>string</code></dt>
<dd><p>Translate using an English key.</p>
</dd>
<dt><a href="#beautifyTemplate">beautifyTemplate(extendedTemplate)</a> ⇒ <code>string</code></dt>
<dd><p>Beautify an HTML-like template. Any Feplet/Mustache code within will be beautified as well.</p>
</dd>
<dt><a href="#deepGet">deepGet(obj, path)</a> ⇒ <code>*</code> | <code>null</code></dt>
<dd><p>Get data from a nested property within an object.</p>
</dd>
<dt><a href="#extendButNotOverride">extendButNotOverride(...objects)</a> ⇒ <code>object</code></dt>
<dd><p>Recursively merge properties of two or more objects into the first object.</p>
</dd>
<dt><a href="#regexReservedCharsEscape">regexReservedCharsEscape(regexStr)</a> ⇒ <code>string</code></dt>
<dd><p>Escape reserved regular expression characters.</p>
</dd>
<dt><a href="#shuffle">shuffle(a)</a> ⇒ <code>array</code></dt>
<dd><p>Shuffle the elements of an array with the Fisher-Yates algorithm.</p>
</dd>
<dt><a href="#strReplaceGlobal">strReplaceGlobal(haystack, needle, replacement)</a> ⇒ <code>string</code></dt>
<dd><p>More efficient global string replace than String.prototype.replace.</p>
</dd>
<dt><a href="#backendDirCheck">backendDirCheck(backendDir)</a> ⇒ <code>string</code></dt>
<dd><p>Validate existence of a backend subdirectory.</p>
</dd>
<dt><a href="#rmRfFilesNotDirs">rmRfFilesNotDirs(dirToEmpty)</a></dt>
<dd><p>Recursively empty a directory of files, but not nested directories.</p>
</dd>
<dt><a href="#extNormalize">extNormalize(ext)</a> ⇒ <code>string</code></dt>
<dd><p>Normalize a file extension. Ensure that it is trimmed of extraneous whitespace, contains only valid characters, and
is prepended with a dot if it was omitted as the first valid character.</p>
</dd>
<dt><a href="#findup">findup(filename, workDir)</a> ⇒ <code>string</code></dt>
<dd><p>Search the file system from a starting directory upward.</p>
</dd>
<dt><a href="#pathResolve">pathResolve(...pathSegments)</a> ⇒ <code>string</code></dt>
<dd><p>Concatenate and normalize path segments, and also ensure that path separators are forward-slashes.
Resolution will not occur with the file system, so relative paths will stay relative and wrong paths will stay wrong.
Accepts string arguments to be concatenated into a forward-slash separated path.</p>
</dd>
<dt><a href="#uiConfigNormalize">uiConfigNormalize(uiObj, workDir, [appDir])</a> ⇒ <code>object</code></dt>
<dd><p>Normalize UI config values.
Strip leading dot+slashes and trailing slashes from relative paths and save.
Turn relative paths into absolute paths and save.
Prepend leading dots to extension nnames if necessary.</p>
</dd>
<dt><a href="#error">error(...args)</a></dt>
<dd><p>Abstract console.error to not trigger lint warnings/errors.
Outputs the error in red text.</p>
</dd>
<dt><a href="#i">i(obj, [depth], [showHidden])</a></dt>
<dd><p>&quot;i&quot; for &quot;inspect&quot;. Shorthand for util.inspect or console.dir.
This exists primarily for internal debugging.</p>
</dd>
<dt><a href="#info">info(...args)</a></dt>
<dd><p>Abstract console.info to not trigger lint warnings/errors.
Outputs the info in green text.</p>
</dd>
<dt><a href="#log">log(...args)</a></dt>
<dd><p>Abstract console.log to not trigger lint warnings/errors.</p>
</dd>
<dt><a href="#warn">warn(...args)</a></dt>
<dd><p>Abstract console.warn to not trigger lint warnings/errors.
Outputs the warning in yellow text.</p>
</dd>
<dt><a href="#webservedDirnamesTruncate">webservedDirnamesTruncate(webservedDirsFull)</a> ⇒ <code>array</code></dt>
<dd><p>Remove first path segment from values in webservedDirsFull array. Return a new array composed of these new values.</p>
</dd>
<dt><a href="#webservedDirsCopy">webservedDirsCopy(webservedDirsFull, webservedDirsShort, staticDir)</a></dt>
<dd><p>Copy webserved dirs to static site dir.</p>
</dd>
</dl>

<a name="t"></a>

## t(key) ⇒ <code>string</code>
Translate using an English key.

**Kind**: exported function  
**Returns**: <code>string</code> - The phrase in another language (or an English alternative).  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The phrase in English. |

<a name="beautifyTemplate"></a>

## beautifyTemplate(extendedTemplate) ⇒ <code>string</code>
Beautify an HTML-like template. Any Feplet/Mustache code within will be beautified as well.

**Kind**: exported function  
**Returns**: <code>string</code> - The beautified template code.  

| Param | Type | Description |
| --- | --- | --- |
| extendedTemplate | <code>string</code> | The string contents of an HTML-like template. |

<a name="deepGet"></a>

## deepGet(obj, path) ⇒ <code>\*</code> \| <code>null</code>
Get data from a nested property within an object.

**Kind**: exported function  
**Returns**: <code>\*</code> \| <code>null</code> - The retrieved data or null on failure.  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>object</code> | The object from which to get the data. |
| path | <code>string</code> \| <code>array</code> | Dot-notation string to the nested property, or array of keys if dot-notation won't work. |

<a name="extendButNotOverride"></a>

## extendButNotOverride(...objects) ⇒ <code>object</code>
Recursively merge properties of two or more objects into the first object.

**Kind**: exported function  
**Returns**: <code>object</code> - The mutated first object.  

| Param | Type | Description |
| --- | --- | --- |
| ...objects | <code>object</code> | The objects to get merged.   The first object will not have its properties overwritten.   It will be extended with additional properties from the additional objects.   Since the first object gets mutated, the return value is only necessary for referencing to a new variable. |

<a name="regexReservedCharsEscape"></a>

## regexReservedCharsEscape(regexStr) ⇒ <code>string</code>
Escape reserved regular expression characters.

**Kind**: exported function  
**Returns**: <code>string</code> - A regular expression with escaped reserved characters.  

| Param | Type | Description |
| --- | --- | --- |
| regexStr | <code>string</code> | The regular expression with unescaped reserved characters. |

<a name="shuffle"></a>

## shuffle(a) ⇒ <code>array</code>
Shuffle the elements of an array with the Fisher-Yates algorithm.

**Kind**: exported function  
**Returns**: <code>array</code> - Shuffled array.  
**See**

- https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
- https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
- https://github.com/e2tha-e/js-shuffle-algorithms


| Param | Type | Description |
| --- | --- | --- |
| a | <code>array</code> | Array to be shuffled.   Since a gets mutated, the return value is only necessary for the purpose of referencing to a new variable. |

<a name="strReplaceGlobal"></a>

## strReplaceGlobal(haystack, needle, replacement) ⇒ <code>string</code>
More efficient global string replace than String.prototype.replace.

**Kind**: exported function  
**Returns**: <code>string</code> - Modified full string.  

| Param | Type | Description |
| --- | --- | --- |
| haystack | <code>string</code> | Full string to be modified. |
| needle | <code>string</code> | The substring to be replaced. |
| replacement | <code>string</code> | The substring to replace `needle`. |

<a name="backendDirCheck"></a>

## backendDirCheck(backendDir) ⇒ <code>string</code>
Validate existence of a backend subdirectory.

**Kind**: exported function  
**Returns**: <code>string</code> - A valid absolute path to the backend subdirectory, or an empty string.  

| Param | Type | Description |
| --- | --- | --- |
| backendDir | <code>string</code> | The path to a subdirectory of the backend. |

<a name="rmRfFilesNotDirs"></a>

## rmRfFilesNotDirs(dirToEmpty)
Recursively empty a directory of files, but not nested directories.

**Kind**: exported function  

| Param | Type | Description |
| --- | --- | --- |
| dirToEmpty | <code>string</code> | Directory to empty. |

<a name="extNormalize"></a>

## extNormalize(ext) ⇒ <code>string</code>
Normalize a file extension. Ensure that it is trimmed of extraneous whitespace, contains only valid characters, and
is prepended with a dot if it was omitted as the first valid character.

**Kind**: exported function  
**Returns**: <code>string</code> - A normalized file extension, or an empty string if it fails validation.  

| Param | Type | Description |
| --- | --- | --- |
| ext | <code>string</code> | File extension. |

<a name="findup"></a>

## findup(filename, workDir) ⇒ <code>string</code>
Search the file system from a starting directory upward.

**Kind**: exported function  
**Returns**: <code>string</code> - The absolute path to the found file or an empty string if the search fails.  

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> | The file being searched for. |
| workDir | <code>string</code> | The absolute path where the search starts. |

<a name="pathResolve"></a>

## pathResolve(...pathSegments) ⇒ <code>string</code>
Concatenate and normalize path segments, and also ensure that path separators are forward-slashes.
Resolution will not occur with the file system, so relative paths will stay relative and wrong paths will stay wrong.
Accepts string arguments to be concatenated into a forward-slash separated path.

**Kind**: exported function  
**Returns**: <code>string</code> - Path.  

| Param | Type | Description |
| --- | --- | --- |
| ...pathSegments | <code>string</code> | Path or path segments. |

<a name="uiConfigNormalize"></a>

## uiConfigNormalize(uiObj, workDir, [appDir]) ⇒ <code>object</code>
Normalize UI config values.
Strip leading dot+slashes and trailing slashes from relative paths and save.
Turn relative paths into absolute paths and save.
Prepend leading dots to extension nnames if necessary.

**Kind**: exported function  
**Returns**: <code>object</code> - The mutated uiObj.  

| Param | Type | Description |
| --- | --- | --- |
| uiObj | <code>object</code> | The UI configuration object.   Since uiObj gets mutated, the return value is only necessary for the purpose of referencing to a new variable. |
| workDir | <code>string</code> | The absolute path to the directory directly above the relative paths in the uiObj. |
| [appDir] | <code>string</code> | The absolute path to the fepper-npm directory. Only necessary when Pattern Lab is   instantiated without Fepper. |

<a name="error"></a>

## error(...args)
Abstract console.error to not trigger lint warnings/errors.
Outputs the error in red text.

**Kind**: exported function  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | Same arguments as console.error. |

<a name="i"></a>

## i(obj, [depth], [showHidden])
"i" for "inspect". Shorthand for util.inspect or console.dir.
This exists primarily for internal debugging.

**Kind**: exported function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| obj | <code>object</code> |  | The object to inspect. |
| [depth] | <code>null</code> \| <code>number</code> | <code>null</code> | Number of times to recurse while inspecting the object. `null` means infinity. |
| [showHidden] | <code>boolean</code> | <code>false</code> | Whether the object's non-enumerable properties will be included in the result. |

<a name="info"></a>

## info(...args)
Abstract console.info to not trigger lint warnings/errors.
Outputs the info in green text.

**Kind**: exported function  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | Same arguments as console.info. |

<a name="log"></a>

## log(...args)
Abstract console.log to not trigger lint warnings/errors.

**Kind**: exported function  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | Same arguments as console.log. |

<a name="warn"></a>

## warn(...args)
Abstract console.warn to not trigger lint warnings/errors.
Outputs the warning in yellow text.

**Kind**: exported function  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | Same arguments as console.warn. |

<a name="webservedDirnamesTruncate"></a>

## webservedDirnamesTruncate(webservedDirsFull) ⇒ <code>array</code>
Remove first path segment from values in webservedDirsFull array. Return a new array composed of these new values.

**Kind**: exported function  
**Returns**: <code>array</code> - The webserved directories stripped of configuration prefix.  

| Param | Type | Description |
| --- | --- | --- |
| webservedDirsFull | <code>array</code> | The array of webserved directories. |

<a name="webservedDirsCopy"></a>

## webservedDirsCopy(webservedDirsFull, webservedDirsShort, staticDir)
Copy webserved dirs to static site dir.

**Kind**: exported function  

| Param | Type | Description |
| --- | --- | --- |
| webservedDirsFull | <code>array</code> | Path to directories webserved by Fepper. |
| webservedDirsShort | <code>array</code> | Path to directories webserved by Fepper truncated for publishing to static site. |
| staticDir | <code>string</code> | The destination directory. |

<!-- STOP jsdoc-to-markdown GENERATED API DOC -->
