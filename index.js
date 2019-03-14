'use strict';

const beautify = require('js-beautify').html;
const fs = require('fs-extra');
const JSON5 = require('json5');
const path = require('path');
const RcLoader = require('rcloader');
const slash = require('slash');
const yaml = require('js-yaml');

const enc = 'utf8';

// /////////////////////////////////////////////////////////////////////////////
// Conf and global vars.
// /////////////////////////////////////////////////////////////////////////////

// Do not JSDoc.
exports.conf = () => {
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

  // Retrieve custom values for UI.
  try {
    const confUiStr = fs.readFileSync(`${rootDir}/patternlab-config.json`, enc);
    conf.ui = JSON5.parse(confUiStr);

    // Update Pattern Lab paths.
    exports.uiConfigNormalize(conf.ui, rootDir);
  }
  catch (err) {
    exports.error(err);
    exports.error('Missing or malformed patternlab-config.json! Exiting!');

    return;
  }

  const appDir = global.appDir;

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
    const defaultsUiStr = fs.readFileSync(`${appDir}/excludes/patternlab-config.json`, enc);
    defaults.ui = JSON5.parse(defaultsUiStr);

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

  // Set is_windows boolean.
  conf.is_windows = (process.env.ComSpec && process.env.ComSpec.toLowerCase() === 'c:\\windows\\system32\\cmd.exe');

  // HTML scraper confs. Defining here because they should never be exposed to end-users.
  conf.scrape = {
    limit_error_msg: 'Submitting too many requests per minute.',
    limit_time: 30000,
    scraper_file: `00-html-scraper${conf.ui.patternExtension}`
  };

  // Write to global object.
  // This assignment is deprecated and will be removed. The assignment should be explicit where .conf() is invoked.
  global.conf = conf;

  return conf;
};

// Do not JSDoc.
exports.findupRootDir = (cwd, dirname) => {
  let rootDir = '';

  if (cwd) {
    rootDir = slash(cwd);
  }
  else if (process.env.ROOT_DIR) {
    rootDir = slash(process.env.ROOT_DIR);
  }
  else {
    // this.findup() will replace backslashes with slashes.
    rootDir = this.findup('fepper.command', dirname);
  }

  if (!rootDir) {
    this.error('Fepper cannot find the directory in which to start working! ' +
      'You may need to submit it as a constructor argument! Exiting!');
    throw new Error('EINVAL');
  }

  return rootDir;
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
  // This assignment is deprecated and will be removed. The assignment should be explicit where .pref() is invoked.
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

/**
 * Beautify an HTML-like template. Any Feplet/Mustache code within will be beautified as well.
 *
 * @param {string} extendedTemplate - The string contents of an HTML-like template.
 * @returns {string} The beautified template code.
 */
exports.beautifyTemplate = (extendedTemplate) => {
  // Load js-beautify with options configured in .jsbeautifyrc.
  const rcFile = '.jsbeautifyrc';
  const rcLoader = new RcLoader(rcFile);
  let rcOpts;

  // First, try to load .jsbeautifyrc with user-configurable options.
  if (fs.existsSync(`${global.conf.rootDir}/${rcFile}`)) {
    rcOpts = rcLoader.for(`${global.conf.rootDir}/${rcFile}`, {lookup: false});
  }
  // Next, try to load the .jsbeautifyrc that ships with fepper-npm.
  else if (fs.existsSync(`${global.conf.appDir}/${rcFile}`)) {
    rcOpts = rcLoader.for(`${global.conf.appDir}/${rcFile}`, {lookup: false});
  }
  // Else, lookup for any existing .jsbeautifyrc.
  else {
    rcOpts = rcLoader.for(__dirname, {lookup: true});
  }

  let beautifiedTemplate = extendedTemplate;

  // We sometimes want output templates to be in a language with tags delimited by stashes.
  // In order for js-beautify to indent such code correctly, any space between control characters #, ^, and /, and
  // the variable name must be removed. However, we want to add the spaces back later.
  // \u00A0 is &nbsp; a space character not enterable by keyboard, and therefore a good delimiter.
  beautifiedTemplate = beautifiedTemplate.replace(/(\{\{#)(\s+)(\S+)/g, '$1$3$2\u00A0');
  beautifiedTemplate = beautifiedTemplate.replace(/(\{\{\^)(\s+)(\S+)/g, '$1$3$2\u00A0');
  beautifiedTemplate = beautifiedTemplate.replace(/(\{\{\/)(\s+)(\S+)/g, '$1$3$2\u00A0');

  // Run it through js-beautify.
  beautifiedTemplate = beautify(beautifiedTemplate, rcOpts);

  // Add back removed spaces to retain the look intended by the author.
  beautifiedTemplate = beautifiedTemplate.replace(/(\{\{#)(\S+)(\s+)\u00A0/g, '$1$3$2');
  beautifiedTemplate = beautifiedTemplate.replace(/(\{\{\^)(\S+)(\s+)\u00A0/g, '$1$3$2');
  beautifiedTemplate = beautifiedTemplate.replace(/(\{\{\/)(\S+)(\s+)\u00A0/g, '$1$3$2');

  // Delete empty lines.
  beautifiedTemplate = beautifiedTemplate.replace(/^\s*$\n/gm, '');

  return beautifiedTemplate;
};

// /////////////////////////////////////////////////////////////////////////////
// Data utilities.
// /////////////////////////////////////////////////////////////////////////////

/**
 * Get data from a nested property within an object.
 *
 * @param {object} obj - The object from which to get the data.
 * @param {string|array} path - Dot-notation string to the nested property, or array of keys if dot-notation won't work.
 * @returns {*|null} The retrieved data or null on failure.
 */
exports.deepGet = (obj, path) => {
  let pathElements;

  if (typeof path === 'string') {
    pathElements = path.split('.');
  }
  else if (Array.isArray(path)) {
    pathElements = path;
  }
  else {
    // This case will return the obj parameter if a path wasn't submitted.
    // A possible user-error would be `exports.deepGet(nest.egg.yolk)` instead of `exports.deepGet(nest, 'egg.yolk')`.
    // Alert the user when this is the case and provide a stack trace.
    try {
      throw new Error('fepper-utils deepGet() requires a valid path parameter, i.e. `deepGet(nest, \'egg.yolk\')`');
    }
    catch (err) {
      exports.error(err);
    }

    return obj;
  }

  if (!(obj instanceof Object)) {
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
 * Recursively merge properties of two or more objects into the first object.
 *
 * @param {...object} objects - The objects to get merged.
 *   The first object will not have its properties overwritten.
 *   It will be extended with additional properties from the additional objects.
 *   Since the first object gets mutated, the return value is only necessary for referencing to a new variable.
 * @returns {object} The mutated first object.
 */
exports.extendButNotOverride = (...objects) => {
  const target = objects[0];

  for (let i = 1, l = objects.length; i < l; i++) {
    const source = objects[i];

    for (let j in source) {
      if (!source.hasOwnProperty(j)) {
        continue;
      }

      try {

        // Only recurse if source[j] is an Object. Will copy arrays since we're not going to resolve lengths.
        if (source[j].constructor === Object) {

          // Create target[j] if undefined and source[j] is defined.
          // eslint-disable-next-line eqeqeq
          if (target[j] == null) {
            target[j] = {};
          }

          target[j] = exports.extendButNotOverride(target[j], source[j]);
        }

        // Pop when recursion meets a non-Object. If source[j] is a non-Object, only copy to undefined target[j].
        // This way, target is not overriden, only extended.
        // eslint-disable-next-line eqeqeq
        else if (target[j] == null) {
          target[j] = source[j];
        }
      }
      catch (err) {

        // Property in destination object not set; create it and set its value.
        // eslint-disable-next-line eqeqeq
        if (target[j] ==null) {
          target[j] = source[j];
        }
      }
    }
  }

  return target;
};

/**
 * Escape reserved regular expression characters.
 *
 * @param {string} regexStr - The regular expression with unescaped reserved characters.
 * @returns {string} A regular expression with escaped reserved characters.
 */
exports.regexReservedCharsEscape = (regexStr) => {
  // eslint-disable-next-line no-useless-escape
  return regexStr.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
};

/**
 * Shuffle the elements of an array with the Fisher-Yates algorithm.
 * @see https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 *
 * @param {array} a - Array to be shuffled.
 *   Since a gets mutated, the return value is only necessary for the purpose of referencing to a new variable.
 * @returns {array} Shuffled array.
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
 * @param {string} backendDir - The path to a subdirectory of the backend.
 * @returns {string} A valid absolute path to the backend subdirectory, or an empty string.
 */
exports.backendDirCheck = (backendDir) => {
  if (backendDir && typeof backendDir === 'string') {
    const backendDirTrimmed = backendDir.trim();
    let fullPath;
    let stat;

    if (backendDirTrimmed.indexOf(global.conf.backend_dir) === 0) {
      fullPath = backendDirTrimmed;
    }
    else {
      fullPath = `${global.conf.backend_dir}/${backendDirTrimmed}`;
    }

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
 * @returns {string} A normalized file extension, or an empty string if it fails validation.
 */
exports.extNormalize = (ext) => {
  if (typeof ext === 'string') {
    let extNormalized = ext.trim();

    if (extNormalized[0] !== '.') {
      extNormalized = `.${extNormalized}`;
    }

    // eslint-disable-next-line no-useless-escape
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
 * @returns {string} The absolute path to the found file or an empty string if the search fails.
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
 * @param {...string} pathSegments - Path or path segments.
 * @returns {string} Path.
 */
exports.pathResolve = (...pathSegments) => {
  let pathName = '';

  for (let i = 0, l = pathSegments.length; i < l; i++) {
    if (i) {
      pathName += '/';
    }

    pathName += pathSegments[i];
  }

  return slash(path.normalize(pathName));
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
 * @param {string} [appDir] - The absolute path to the fepper-npm directory. Only necessary when Pattern Lab is
 *   instantiated without Fepper.
 * @returns {object} The mutated uiObj.
 */
exports.uiConfigNormalize = (uiObj, workDir, appDir) => {
  if (!uiObj || !uiObj.paths || !uiObj.paths.source) {
    throw 'Missing or malformed paths.source property!';
  }

  if (!uiObj.paths.public) {
    throw 'Missing or malformed paths.public property!';
  }

  // Fepper automatically sets global.appDir. Pattern Lab without Fepper needs to set it here.
  if (appDir) {
    global.appDir = appDir;
  }

  if (process.env.DEBUG) {
    uiObj.debug = true;
  }

  const pathsSource = uiObj.paths.source;
  const pathsPublic = uiObj.paths.public;

  uiObj.paths.core = uiObj.paths.core || `${global.appDir}/ui/core`;
  pathsPublic.styleguide = pathsPublic.styleguide || 'public/node_modules/fepper-ui';

  // gulp.watch() will not trigger on file creation if watching an absolute path, so save normalized relative paths.
  uiObj.pathsRelative = uiObj.pathsRelative || {source: {}, public: {}};

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

  // We also need paths relative to the public directory. This is so names for directories within the UI's document root
  // can be user-configured, and not hard-coded.
  uiObj.pathsPublic = uiObj.pathsPublic || {};
  const regex = new RegExp('^' + uiObj.pathsRelative.public.root + '\\/');

  for (let i in uiObj.pathsRelative.public) {
    if (!uiObj.pathsRelative.public.hasOwnProperty(i)) {
      continue;
    }

    if (i === 'root') {
      continue;
    }

    uiObj.pathsPublic[i] = uiObj.pathsRelative.public[i].replace(regex, '');
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
 *
 * @param {...*} args - Same arguments as console.error.
 */
exports.error = (...args) => {
  if (args.length) {
    const error = args[0];

    if (
      global.conf &&
      exports.deepGet(global.conf, 'ui.debug') === true &&
      error instanceof Error &&
      error.stack
    ) {
      args[0] = '\x1b[31m' + error.stack + '\x1b[0m';
    }
    else {
      args[0] = '\x1b[31m' + error + '\x1b[0m';
    }
  }

  exports.console.error.apply(null, args);
};

exports.httpCodes = {
  404: 'HTTP 404: Not Found',
  500: 'HTTP 500: Internal Server Error'
};

/**
 * "i" for "inspect". Shorthand for util.inspect or console.dir.
 * This exists primarily for internal debugging.
 *
 * @param {object} obj - The object to inspect.
 * @param {null|number} [depth=null] - Number of times to recurse while inspecting the object. `null` means infinity.
 * @param {boolean} [showHidden=false] - Whether the object's non-enumerable properties will be included in the result.
 */
exports.i = (obj, depth = null, showHidden = false) => {
  exports.console.dir(obj, {showHidden, depth});
};

/**
 * Abstract console.info to not trigger lint warnings/errors.
 * Outputs the info in green text.
 *
 * @param {...*} args - Same arguments as console.info.
 */
exports.info = (...args) => {
  if (args.length) {
    args[0] = '\x1b[32m' + args[0] + '\x1b[0m';
  }

  exports.console.info.apply(null, args);
};

/**
 * Abstract console.log to not trigger lint warnings/errors.
 *
 * @param {...*} args - Same arguments as console.log.
 */
exports.log = (...args) => {
  exports.console.log.apply(null, args);
};

/**
 * Abstract console.warn to not trigger lint warnings/errors.
 * Outputs the warning in yellow text.
 *
 * @param {...*} args - Same arguments as console.warn.
 */
exports.warn = (...args) => {
  if (args.length) {
    args[0] = '\x1b[33m' + args[0] + '\x1b[0m';
  }

  exports.console.warn.apply(null, args);
};

// /////////////////////////////////////////////////////////////////////////////
// Webserved directories.
// /////////////////////////////////////////////////////////////////////////////

/**
 * Remove first path segment from values in webservedDirsFull array. Return a new array composed of these new values.
 *
 * @param {array} webservedDirsFull - The array of webserved directories.
 * @returns {array} The webserved directories stripped of configuration prefix.
 */
exports.webservedDirnamesTruncate = (webservedDirsFull) => {
  if (!webservedDirsFull || !webservedDirsFull.length) {
    return [];
  }

  const webservedDirsShort = [];

  for (let i = 0, l = webservedDirsFull.length; i < l; i++) {
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
 * @param {array} webservedDirsShort - Path to directories webserved by Fepper truncated for publishing to static site.
 * @param {string} staticDir - The destination directory.
 */
exports.webservedDirsCopy = (webservedDirsFull, webservedDirsShort, staticDir) => {
  for (let i = 0, l = webservedDirsFull.length; i < l; i++) {
    try {
      fs.copySync(
        `${global.conf.backend_dir}/${webservedDirsFull[i]}`,
        `${staticDir}/${webservedDirsShort[i]}`
      );
    }
    catch (err) {
      exports.error(err);

      continue;
    }
  }
};
