'use strict';

const fs = require('fs-extra');
const JSON5 = require('json5');
const path = require('path');
const slash = require('slash');
const yaml = require('js-yaml');

const enc = 'utf8';

// /////////////////////////////////////////////////////////////////////////////
// Conf and global vars.
// /////////////////////////////////////////////////////////////////////////////

// Do not JSDoc.
exports.conf = (isHeaded = false) => {
  const rootDir = global.rootDir;

  // Return if global.conf already set.
  if (global.conf) {
    return global.conf;
  }

  // Set conf.
  let conf;

  // Get custom confs for Fepper core.
  try {
    const yml = fs.readFileSync(`${rootDir}/conf.yml`, enc);
    conf = yaml.safeLoad(yml);
  }
  catch (err) {
    exports.error(err);
    exports.error('Missing or malformed conf.yml! Exiting!');

    return;
  }

  // Set appDir.
  let appDir;

  if (conf.app_dir) {
    // Using exports.pathResolve() in case there are double-dots in conf.app_dir.
    appDir = global.appDir = conf.app_dir = exports.pathResolve(rootDir, conf.app_dir);
  }
  else {
    appDir = global.appDir;
  }

  // Retrieve custom values for UI.
  try {
    const defaultsStr = fs.readFileSync(`${rootDir}/patternlab-config.json`, enc);
    conf.ui = JSON5.parse(defaultsStr);

    // TODO: enumerate required settings and fail with console error if not present.

    // Update Pattern Lab paths.
    exports.uiConfigNormalize(conf.ui, rootDir);
  }
  catch (err) {
    exports.error(err);
    exports.error('Missing or malformed patternlab-config.json! Exiting!');

    return;
  }

  if (!exports.deepGet(conf, 'ui.paths')) {
    exports.error('patternlab-config.json is missing paths, a critical value! Exiting!');

    return;
  }

  conf.ui.paths.core = `${appDir}/ui/core`;

  // Set defaults.
  let defaults;

  // Get default confs for Fepper core.
  try {
    const yml = fs.readFileSync(`${appDir}/excludes/conf.yml`, enc);
    defaults = yaml.safeLoad(yml);
  }
  catch (err) {
    exports.error(err);
    exports.error('Missing or malformed excludes/conf.yml! Exiting!');

    return;
  }

  // Get default confs for UI.
  try {
    const defaultsStr = fs.readFileSync(`${appDir}/excludes/patternlab-config.json`, enc);
    defaults.ui = JSON5.parse(defaultsStr);

    // Update Pattern Lab paths.
    exports.uiConfigNormalize(defaults.ui, rootDir);
  }
  catch (err) {
    exports.error(err);
    exports.error('Missing or malformed excludes/patternlab-config.json! Exiting!');

    return;
  }

  // Putting enc here for possible future configurability.
  defaults.enc = enc;

  // Override defaults with custom values.
  exports.extendButNotOverride(conf, defaults);

  // Turn relative paths into absolute paths.
  // Using exports.pathResolve() in case there are double-dots in these confs.
  conf.backend_dir = exports.pathResolve(rootDir, conf.backend_dir);
  conf.extend_dir = exports.pathResolve(rootDir, conf.extend_dir);

  conf.headed = isHeaded;

  // HTML scraper confs. Defining here because they should never be exposed to end-users.
  conf.scrape = {
    limit_error_msg: 'Submitting too many requests per minute.',
    limit_time: 30000,
    scraper_file: `00-html-scraper${conf.ui.patternExtension}`
  };

  // Write to global object.
  global.conf = conf;

  return conf;
};

// The difference between conf and pref is that conf values are mandatory. The pref file must still exist even if blank.
// Do not JSDoc.
exports.pref = () => {
  let pref;
  let defaults;

  try {
    const yml = fs.readFileSync(`${global.rootDir}/pref.yml`, enc);
    pref = global.pref = yaml.safeLoad(yml);
  }
  catch (err) {
    exports.error(err);
    exports.error('Missing or malformed pref.yml! Exiting!');

    return;
  }

  try {
    const yml = fs.readFileSync(`${global.appDir}/excludes/pref.yml`, enc);
    defaults = yaml.safeLoad(yml);
  }
  catch (err) {
    exports.error(err);
    exports.error('Missing or malformed excludes/pref.yml! Exiting!');

    return;
  }

  exports.extendButNotOverride(pref, defaults);

  // Write to global object.
  global.pref = pref;

  return pref;
};

// Parse the compiled data.json source file into a JavaScript object, and return that object.
// Do not JSDoc.
exports.data = () => {
  let data = {};

  try {
    const dataStr = fs.readFileSync(`${global.conf.ui.paths.source.data}/data.json`, enc);
    data = JSON5.parse(dataStr);
  }
  catch (err) {
    exports.error(err);
  }

  return data;
};

// /////////////////////////////////////////////////////////////////////////////
// Data utilities.
// /////////////////////////////////////////////////////////////////////////////

/**
 * Get data from a nested property within an object.
 *
 * @param {object} obj - The object from which to get the data.
 * @param {string|array} path - Dot-notation string to the nested property, or array of keys if dot-notation won't work.
 * @return {*|null} The retrieved data or null on failure.
 */
exports.deepGet = (obj, path) => {
  if (!(obj instanceof Object)) {
    return null;
  }

  let pathElements;

  if (typeof path === 'string') {
    pathElements = path.split('.');
  }
  else if (Array.isArray(path)) {
    pathElements = path;
  }
  else {
    return null;
  }

  if (pathElements.length > 1) {
    const firstElement = pathElements.shift();

    if (obj[firstElement]) {
      return exports.deepGet(obj[firstElement], pathElements);
    }
    else {
      return null;
    }
  }
  else {
    if (obj[pathElements[0]]) {
      return obj[pathElements[0]];
    }
    else {
      return null;
    }
  }
};

/**
 * Recursively merge properties of two objects.
 *
 * @param {object} obj1 - This object's properties have priority over obj2.
 * @param {object} obj2 - If obj2 has properties obj1 doesn't, add to obj1, but do not override.
 *   Since obj1 gets mutated, the return value is only necessary for the purpose of referencing to a new variable.
 * @return {object} The mutated obj1 object.
 */
exports.extendButNotOverride = (obj1, obj2) => {
  for (let i in obj2) {
    if (obj2.hasOwnProperty(i)) {
      try {
        // Only recurse if obj2[i] is an object.
        if (obj2[i].constructor === Object) {
          // Requires 2 objects as params; create obj1[i] if undefined.
          if (typeof obj1[i] === 'undefined' || obj1[i] === null) {
            obj1[i] = {};
          }
          obj1[i] = exports.extendButNotOverride(obj1[i], obj2[i]);
        // Pop when recursion meets a non-object. If obj2[i] is a non-object,
        // only copy to undefined obj1[i]. This way, obj1 is not overriden.
        }
        else if (typeof obj1[i] === 'undefined' || obj1[i] === null) {
          obj1[i] = obj2[i];
        }
      }
      catch (err) {
        // Property in destination object not set; create it and set its value.
        if (typeof obj1[i] === 'undefined' || obj1[i] === null) {
          obj1[i] = obj2[i];
        }
      }
    }
  }

  return obj1;
};

/**
 * Escape reserved regular expression characters.
 *
 * @param {string} regexStr - The regular expression with unescaped reserved characters.
 * @return {string} A regular expression with escaped reserved characters.
 */
exports.regexReservedCharsEscape = (regexStr) => {
  return regexStr.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
};

/**
 * Shuffle the elements of an array with the Fisher-Yates algorithm.
 * @see https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 *
 * @param {array} a - Array to be shuffled.
 *   Since a gets mutated, the return value is only necessary for the purpose of referencing to a new variable.
 * @return {array} Shuffled array.
 */
exports.shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const x = a[i];
    a[i] = a[j];
    a[j] = x;
  }

  return a;
};

// /////////////////////////////////////////////////////////////////////////////
// File system utilities.
// /////////////////////////////////////////////////////////////////////////////

/**
 * Validate existence of a backend subdirectory.
 *
 * @param {string} backendDir - The relative path to a subdirectory of the backend.
 * @return {string} A valid absolute path to the backend subdirectory, or an empty string.
 */
exports.backendDirCheck = (backendDir) => {
  if (typeof backendDir === 'string') {
    const fullPath = `${global.conf.backend_dir}/${backendDir.trim()}`;
    let stat;

    try {
      stat = fs.statSync(fullPath);
    }
    catch (err) {
      // Fail gracefully.
    }

    if (stat && stat.isDirectory()) {
      return fullPath;
    }
  }

  return '';
};

/**
 * Normalize a file extension. Ensure that it is trimmed of extraneous whitespace, contains only valid characters, and
 * is prepended with a dot if it was omitted as the first valid character.
 *
 * @param {string} ext - File extension.
 * @return {string} A normalized file extension, or an empty string if it fails validation.
 */
exports.extNormalize = (ext) => {
  if (typeof ext === 'string') {
    let extNormalized = ext.trim();

    if (extNormalized[0] !== '.') {
      extNormalized = `.${extNormalized}`;
    }

    if (extNormalized.match(/^\.[\w\-\.\/]+$/)) {
      return extNormalized;
    }

    exports.error(`The ${ext} extension contains invalid characters!`);
  }

  return '';
};

/**
 * Search the file system from a starting directory upward.
 *
 * @param {string} filename - The file being searched for.
 * @param {string} workDir - The absolute path where the search starts.
 * @return {string} The absolute path to the found file or an empty string if the search fails.
 */
exports.findup = (filename, workDir) => {
  const workDirFiles = fs.readdirSync(workDir);

  if (workDirFiles.indexOf(filename) > -1) {
    return slash(workDir);
  }

  // Need to work with the operating system's path separators, so use Node path methods.
  const workDirUp = path.normalize(path.join(workDir, '..'));
  const workDirUpFiles = fs.readdirSync(workDirUp);
  let dirMatch = '';

  if (workDirUpFiles.indexOf(filename) > -1) {
    return slash(workDirUp);
  }
  else if (workDirUp !== '/') {
    dirMatch = exports.findup(filename, workDirUp);
  }
  else {
    return '';
  }

  return slash(dirMatch);
};

/**
 * Concatenate and normalize path segments, and also ensure that path separators are forward-slashes.
 * Resolution will not occur with the file system, so relative paths will stay relative and wrong paths will stay wrong.
 * Accepts string arguments to be concatenated into a forward-slash separated path.
 *
 * @return {string} Path.
 */
// Need to use the old function statement syntax so the arguments object works correctly.
exports.pathResolve = function () {
  let pathname = '';

  for (let i = 0; i < arguments.length; i++) {
    if (i) {
      pathname += '/';
    }

    pathname += arguments[i];
  }

  return slash(path.normalize(pathname));
};

/**
 * Normalize UI config values.
 * Strip leading dot+slashes and trailing slashes from relative paths and save.
 * Turn relative paths into absolute paths and save.
 * Prepend leading dots to extension nnames if necessary.
 *
 * @param {object} uiObj - The UI configuration object.
 *   Since uiObj gets mutated, the return value is only necessary for the purpose of referencing to a new variable.
 * @param {string} workDir - The absolute path to the directory directly above the relative paths in the uiObj.
 * @return {object} The mutated uiObj.
 */
exports.uiConfigNormalize = (uiObj, workDir) => {
  if (!uiObj || !uiObj.paths || !uiObj.paths.source) {
    throw 'Missing or malformed paths.source property!';
  }

  if (!uiObj.paths.public) {
    throw 'Missing or malformed paths.source property!';
  }

  const pathsPublic = uiObj.paths.public;
  const pathsSource = uiObj.paths.source;

  // gulp.watch() will not trigger on file creation if watching an absolute path, so save normalized relative paths.
  uiObj.pathsRelative = uiObj.pathsRelative || {source: {}, public: {}};

  for (let i in pathsPublic) {
    if (!pathsPublic.hasOwnProperty(i)) {
      continue;
    }

    let pathPublic = pathsPublic[i];

    if (pathPublic.slice(0, 2) === './') {
      pathPublic = pathPublic.slice(2);
    }

    if (pathPublic.slice(-1) === '/') {
      pathPublic = pathPublic.slice(0, -1);
    }

    if (pathsPublic[i].indexOf(workDir) !== 0) {
      uiObj.pathsRelative.public[i] = pathPublic;
      pathsPublic[i] = `${workDir}/${pathPublic}`;
    }
  }

  for (let i in pathsSource) {
    if (!pathsSource.hasOwnProperty(i)) {
      continue;
    }

    let pathSource = pathsSource[i];

    if (pathSource.slice(0, 2) === './') {
      pathSource = pathSource.slice(2);
    }

    if (pathSource.slice(-1) === '/') {
      pathSource = pathSource.slice(0, -1);
    }

    if (pathsSource[i].indexOf(workDir) !== 0) {
      uiObj.pathsRelative.source[i] = pathSource;
      pathsSource[i] = `${workDir}/${pathSource}`;
    }
  }

  if (uiObj.patternExportDirectory.indexOf(workDir) !== 0) {
    let patternExportDirectory = uiObj.patternExportDirectory;

    if (patternExportDirectory.slice(0, 2) === './') {
      patternExportDirectory = patternExportDirectory.slice(2);
    }

    if (patternExportDirectory.slice(-1) === '/') {
      patternExportDirectory = patternExportDirectory.slice(0, -1);
    }

    uiObj.patternExportDirectory = `${workDir}/${patternExportDirectory}`;
  }

  // The Pattern Lab for Node project is chaotically inconsistent about leading dots, and other delimiting characters,
  // in configs, and just about anywhere else.
  // Fepper must abide by the Node.js convention where extnames have leading dots. While the Fepper default config
  // extnames always have leading dots, we need to account for configs imported from unforked Pattern Lab instances.
  if (uiObj.patternExtension.charAt(0) !== '.') {
    uiObj.patternExtension = `.${uiObj.patternExtension}`;
  }

  return uiObj;
};

// /////////////////////////////////////////////////////////////////////////////
// Logging.
// /////////////////////////////////////////////////////////////////////////////

exports.console = console;

/**
 * Abstract console.error to not trigger lint warnings/errors.
 * Outputs the error in red text.
 * Accepts the same arguments as console.error.
 */
// Need to use the old function statement syntax so the arguments object works correctly.
exports.error = function () {
  if (arguments.length) {
    const error = arguments[0];

    if (
      global.conf &&
      exports.deepGet(global.conf, 'ui.debug') === true &&
      error instanceof Error &&
      error.stack
    ) {
      arguments[0] = '\x1b[31m' + error.stack + '\x1b[0m';
    }
    else {
      arguments[0] = '\x1b[31m' + error + '\x1b[0m';
    }
  }

  exports.console.error.apply(null, arguments);
};

exports.httpCodes = {
  404: 'HTTP 404: Not Found',
  500: 'HTTP 500: Internal Server Error'
};

/**
 * "i" for "inspect". Shorthand for util.inspect or console.dir.
 * This exists primarily for internal debugging. Be sure to remove invocations when done because they won't pass lint.
 *
 * @param {object} obj - The object to inspect.
 * @param {null|number} depth - The number of times to recurse while inspecting the object. null means infinity.
 * @param {boolean} showHidden - Whether the object's non-enumerable properties will be included in the result.
 */
exports.i = (obj, depth = null, showHidden = false) => {
  exports.console.dir(obj, {showHidden, depth});
};

/**
 * Abstract console.info to not trigger lint warnings/errors.
 * Outputs the info in green text.
 * Accepts the same arguments as console.info.
 */
// Need to use the old function statement syntax so the arguments object works correctly.
exports.info = function () {
  if (arguments.length) {
    arguments[0] = '\x1b[32m' + arguments[0] + '\x1b[0m';
  }

  exports.console.info.apply(null, arguments);
};

/**
 * Abstract console.log to not trigger lint warnings/errors.
 * Accepts the same arguments as console.log.
 */
// Need to use the old function statement syntax so the arguments object works correctly.
exports.log = function () {
  exports.console.log.apply(null, arguments);
};

/**
 * Abstract console.warn to not trigger lint warnings/errors.
 * Outputs the warning in yellow text.
 * Accepts the same arguments as console.warn.
 */
// Need to use the old function statement syntax so the arguments object works correctly.
exports.warn = function () {
  if (arguments.length) {
    arguments[0] = '\x1b[33m' + arguments[0] + '\x1b[0m';
  }

  exports.console.warn.apply(null, arguments);
};

// /////////////////////////////////////////////////////////////////////////////
// Webserved directories.
// /////////////////////////////////////////////////////////////////////////////

/**
 * Remove first path segment from values in webservedDirsFull array. Return a new array composed of these new values.
 *
 * @param {array} webservedDirsFull - The array of webserved directories.
 * @return {array} The webserved directories stripped of configuration prefix.
 */
exports.webservedDirnamesTruncate = (webservedDirsFull) => {
  if (!webservedDirsFull || !webservedDirsFull.length) {
    return [];
  }

  const webservedDirsShort = [];

  for (let i = 0; i < webservedDirsFull.length; i++) {
    const webservedDirSplit = webservedDirsFull[i].split('/');
    webservedDirSplit.shift();
    webservedDirsShort.push(webservedDirSplit.join('/'));
  }

  return webservedDirsShort;
};

/**
 * Copy webserved dirs to static site dir.
 *
 * @param {array} webservedDirsFull - Path to directories webserved by Fepper.
 * @param {array} webservedDirsShort - Path to directories webserved by Fepper
 *   truncated for publishing to static site.
 * @param {string} staticDir - The destination directory.
 */
exports.webservedDirsCopy = (webservedDirsFull, webservedDirsShort, staticDir) => {
  for (let i = 0; i < webservedDirsFull.length; i++) {
    fs.copySync(
      `${global.conf.backend_dir}/${webservedDirsFull[i]}`,
      `${staticDir}/${webservedDirsShort[i]}`
    );
  }
};
