# Fepper Utilities

If you are creating a Fepper extension:

```shell
npm install --save fepper-utils
```

Then, require in your JavaScript:

```javascript
const utils = require('fepper-utils');
```

## Functions

<dl>
<dt><a href="#deepGet">deepGet(obj, path)</a> ⇒ <code>*</code> | <code>null</code></dt>
<dd><p>Get data from a nested property within an object.</p>
</dd>
<dt><a href="#extendButNotOverride">extendButNotOverride(obj1, obj2)</a> ⇒ <code>object</code></dt>
<dd><p>Recursively merge properties of two objects.</p>
</dd>
<dt><a href="#regexReservedCharsEscape">regexReservedCharsEscape(regexStr)</a> ⇒ <code>string</code></dt>
<dd><p>Escape reserved regular expression characters.</p>
</dd>
<dt><a href="#shuffle">shuffle(a)</a> ⇒ <code>array</code></dt>
<dd><p>Shuffle the elements of an array with the Fisher-Yates algorithm.</p>
</dd>
<dt><a href="#backendDirCheck">backendDirCheck(backendDir)</a> ⇒ <code>string</code></dt>
<dd><p>Validate existence of a backend subdirectory.</p>
</dd>
<dt><a href="#extNormalize">extNormalize(ext)</a> ⇒ <code>string</code></dt>
<dd><p>Normalize a file extension. Ensure that it is trimmed of extraneous whitespace, contains only valid characters, and
is prepended with a dot if it was omitted as the first valid character.</p>
</dd>
<dt><a href="#findup">findup(filename, workDir)</a> ⇒ <code>string</code></dt>
<dd><p>Search the file system from a starting directory upward.</p>
</dd>
<dt><a href="#pathResolve">pathResolve()</a> ⇒ <code>string</code></dt>
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
<dt><a href="#error">error()</a></dt>
<dd><p>Abstract console.error to not trigger lint warnings/errors.
Outputs the error in red text.
Accepts the same arguments as console.error.</p>
</dd>
<dt><a href="#i">i(obj, depth, showHidden)</a></dt>
<dd><p>&quot;i&quot; for &quot;inspect&quot;. Shorthand for util.inspect or console.dir.
This exists primarily for internal debugging. Be sure to remove invocations when done because they won&#39;t pass lint.</p>
</dd>
<dt><a href="#info">info()</a></dt>
<dd><p>Abstract console.info to not trigger lint warnings/errors.
Outputs the info in green text.
Accepts the same arguments as console.info.</p>
</dd>
<dt><a href="#log">log()</a></dt>
<dd><p>Abstract console.log to not trigger lint warnings/errors.
Accepts the same arguments as console.log.</p>
</dd>
<dt><a href="#warn">warn()</a></dt>
<dd><p>Abstract console.warn to not trigger lint warnings/errors.
Outputs the warning in yellow text.
Accepts the same arguments as console.warn.</p>
</dd>
<dt><a href="#webservedDirnamesTruncate">webservedDirnamesTruncate(webservedDirsFull)</a> ⇒ <code>array</code></dt>
<dd><p>Remove first path segment from values in webservedDirsFull array. Return a new array composed of these new values.</p>
</dd>
<dt><a href="#webservedDirsCopy">webservedDirsCopy(webservedDirsFull, webservedDirsShort, staticDir)</a></dt>
<dd><p>Copy webserved dirs to static site dir.</p>
</dd>
</dl>

<a name="deepGet"></a>

## deepGet(obj, path) ⇒ <code>\*</code> \| <code>null</code>
Get data from a nested property within an object.

**Kind**: global function  
**Returns**: <code>\*</code> \| <code>null</code> - The retrieved data or null on failure.  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>object</code> | The object from which to get the data. |
| path | <code>string</code> \| <code>array</code> | Dot-notation string to the nested property, or array of keys if dot-notation won't work. |

<a name="extendButNotOverride"></a>

## extendButNotOverride(obj1, obj2) ⇒ <code>object</code>
Recursively merge properties of two objects.

**Kind**: global function  
**Returns**: <code>object</code> - The mutated obj1 object.  

| Param | Type | Description |
| --- | --- | --- |
| obj1 | <code>object</code> | This object's properties have priority over obj2. |
| obj2 | <code>object</code> | If obj2 has properties obj1 doesn't, add to obj1, but do not override.   Since obj1 gets mutated, the return value is only necessary for the purpose of referencing to a new variable. |

<a name="regexReservedCharsEscape"></a>

## regexReservedCharsEscape(regexStr) ⇒ <code>string</code>
Escape reserved regular expression characters.

**Kind**: global function  
**Returns**: <code>string</code> - A regular expression with escaped reserved characters.  

| Param | Type | Description |
| --- | --- | --- |
| regexStr | <code>string</code> | The regular expression with unescaped reserved characters. |

<a name="shuffle"></a>

## shuffle(a) ⇒ <code>array</code>
Shuffle the elements of an array with the Fisher-Yates algorithm.

**Kind**: global function  
**Returns**: <code>array</code> - Shuffled array.  
**See**

- https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
- https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle


| Param | Type | Description |
| --- | --- | --- |
| a | <code>array</code> | Array to be shuffled.   Since a gets mutated, the return value is only necessary for the purpose of referencing to a new variable. |

<a name="backendDirCheck"></a>

## backendDirCheck(backendDir) ⇒ <code>string</code>
Validate existence of a backend subdirectory.

**Kind**: global function  
**Returns**: <code>string</code> - A valid absolute path to the backend subdirectory, or an empty string.  

| Param | Type | Description |
| --- | --- | --- |
| backendDir | <code>string</code> | The relative path to a subdirectory of the backend. |

<a name="extNormalize"></a>

## extNormalize(ext) ⇒ <code>string</code>
Normalize a file extension. Ensure that it is trimmed of extraneous whitespace, contains only valid characters, and
is prepended with a dot if it was omitted as the first valid character.

**Kind**: global function  
**Returns**: <code>string</code> - A normalized file extension, or an empty string if it fails validation.  

| Param | Type | Description |
| --- | --- | --- |
| ext | <code>string</code> | File extension. |

<a name="findup"></a>

## findup(filename, workDir) ⇒ <code>string</code>
Search the file system from a starting directory upward.

**Kind**: global function  
**Returns**: <code>string</code> - The absolute path to the found file or an empty string if the search fails.  

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> | The file being searched for. |
| workDir | <code>string</code> | The absolute path where the search starts. |

<a name="pathResolve"></a>

## pathResolve() ⇒ <code>string</code>
Concatenate and normalize path segments, and also ensure that path separators are forward-slashes.
Resolution will not occur with the file system, so relative paths will stay relative and wrong paths will stay wrong.
Accepts string arguments to be concatenated into a forward-slash separated path.

**Kind**: global function  
**Returns**: <code>string</code> - Path.  

| Param | Type | Description |
| --- | --- | --- |
| ......pathSegments | <code>string</code> | Path or path segments. |

<a name="uiConfigNormalize"></a>

## uiConfigNormalize(uiObj, workDir, [appDir]) ⇒ <code>object</code>
Normalize UI config values.
Strip leading dot+slashes and trailing slashes from relative paths and save.
Turn relative paths into absolute paths and save.
Prepend leading dots to extension nnames if necessary.

**Kind**: global function  
**Returns**: <code>object</code> - The mutated uiObj.  

| Param | Type | Description |
| --- | --- | --- |
| uiObj | <code>object</code> | The UI configuration object.   Since uiObj gets mutated, the return value is only necessary for the purpose of referencing to a new variable. |
| workDir | <code>string</code> | The absolute path to the directory directly above the relative paths in the uiObj. |
| [appDir] | <code>string</code> | The absolute path to the fepper-npm directory. Only necessary when Pattern Lab is   instantiated without Fepper. |

<a name="error"></a>

## error()
Abstract console.error to not trigger lint warnings/errors.
Outputs the error in red text.
Accepts the same arguments as console.error.

**Kind**: global function  
<a name="i"></a>

## i(obj, depth, showHidden)
"i" for "inspect". Shorthand for util.inspect or console.dir.
This exists primarily for internal debugging. Be sure to remove invocations when done because they won't pass lint.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>object</code> | The object to inspect. |
| depth | <code>null</code> \| <code>number</code> | The number of times to recurse while inspecting the object. null means infinity. |
| showHidden | <code>boolean</code> | Whether the object's non-enumerable properties will be included in the result. |

<a name="info"></a>

## info()
Abstract console.info to not trigger lint warnings/errors.
Outputs the info in green text.
Accepts the same arguments as console.info.

**Kind**: global function  
<a name="log"></a>

## log()
Abstract console.log to not trigger lint warnings/errors.
Accepts the same arguments as console.log.

**Kind**: global function  
<a name="warn"></a>

## warn()
Abstract console.warn to not trigger lint warnings/errors.
Outputs the warning in yellow text.
Accepts the same arguments as console.warn.

**Kind**: global function  
<a name="webservedDirnamesTruncate"></a>

## webservedDirnamesTruncate(webservedDirsFull) ⇒ <code>array</code>
Remove first path segment from values in webservedDirsFull array. Return a new array composed of these new values.

**Kind**: global function  
**Returns**: <code>array</code> - The webserved directories stripped of configuration prefix.  

| Param | Type | Description |
| --- | --- | --- |
| webservedDirsFull | <code>array</code> | The array of webserved directories. |

<a name="webservedDirsCopy"></a>

## webservedDirsCopy(webservedDirsFull, webservedDirsShort, staticDir)
Copy webserved dirs to static site dir.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| webservedDirsFull | <code>array</code> | Path to directories webserved by Fepper. |
| webservedDirsShort | <code>array</code> | Path to directories webserved by Fepper   truncated for publishing to static site. |
| staticDir | <code>string</code> | The destination directory. |

