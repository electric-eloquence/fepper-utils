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
// Internationalization.
// /////////////////////////////////////////////////////////////////////////////

/**
 * Translate using an English key.
 *
 * @param {string} key - The phrase in English.
 * @returns {string} The phrase in another language (or an English alternative).
 */
exports.t = (key) => {
  const lang = exports.deepGet(global, 'pref.lang') || 'en';
  let i18nData = exports.deepGet(global, 'pref.i18n');

  if (!i18nData) {
    let i18nFileStr;

    if (
      exports.deepGet(global, 'conf.ui.paths.source.ui') &&
      fs.existsSync(`${global.conf.ui.paths.source.ui}/i18n/${lang}.json`)
    ) {
      i18nFileStr = fs.readFileSync(`${global.conf.ui.paths.source.ui}/i18n/${lang}.json`, enc);
    }
    else if (fs.existsSync(`${global.workDir}/source/_ui/i18n/${lang}.json`)) {
      i18nFileStr = fs.readFileSync(`${global.workDir}/source/_ui/i18n/${lang}.json`, enc);
    }
    else {
      i18nFileStr = fs.readFileSync(`${global.appDir}/excludes/profiles/base/source/_ui/i18n/en.json`, enc);
    }

    i18nData = JSON5.parse(i18nFileStr);

    if (global.pref) {
      global.pref.i18n = i18nData;
    }
  }

  if (i18nData[key]) {
    return i18nData[key];
  }
  else {
    return key;
  }
};

global.t = exports.t;

// /////////////////////////////////////////////////////////////////////////////
// Conf and global vars.
// /////////////////////////////////////////////////////////////////////////////

// The difference between conf and pref is that it is recommended to version-control pref.yml, but not conf.yml.
// exports.conf() must always be run before exports.pref().
// Cannot internationalize messages because conf and pref have not been loaded yet.
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
    conf = global.conf = yaml.safeLoad(yml);
  }
  catch (err) {
    exports.error(err);
    exports.error(`${t('Missing or malformed %s!')} ${t('Exiting!')}`, 'conf.yml');

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
    exports.error(`${t('Missing or malformed %s!')} ${t('Exiting!')}`, 'patternlab-config.json');

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
    exports.error(`${t('Missing or malformed %s!')} ${t('Exiting!')}`, 'excludes/conf.yml');

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
    exports.error(`${t('Missing or malformed %s!')} ${t('Exiting!')}`, 'excludes/patternlab-config.json');

    return;
  }

  // Putting enc here for possible future configurability.
  defaults.enc = enc;

  // Override defaults with custom values.
  exports.extendButNotOverride(conf, defaults);

  // Turn relative path into absolute path.
  // Using exports.pathResolve() in case there are double-dots in this conf.
  conf.extend_dir = exports.pathResolve(rootDir, conf.extend_dir);

  // Set is_windows boolean.
  conf.is_windows = (process.env.ComSpec && process.env.ComSpec.toLowerCase() === 'c:\\windows\\system32\\cmd.exe');

  // HTML scraper confs. Defining here because they should never be exposed to end-users.
  conf.scrape = {
    limit_error_msg: t('Too many requests per minute!'),
    limit_time: 15000,
    scraper_file: `00-html-scraper${conf.ui.patternExtension}`
  };

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
    // exports.findup() will replace backslashes with slashes.
    rootDir = exports.findup('fepper.command', dirname);
  }

  if (!rootDir) {
    // eslint-disable-next-line max-len
    exports.error(`${t('Fepper cannot find the directory in which to start working! You may need to submit it as a constructor argument!')} ` +
      t('Exiting!'));
    throw new Error('EINVAL');
  }

  return rootDir;
};

// The difference between conf and pref is that it is recommended to version-control pref.yml, but not conf.yml.
// exports.pref() must always be run after exports.conf().
// Do not JSDoc.
exports.pref = () => {

  // Return if global.pref already set.
  if (global.pref) {
    return global.pref;
  }

  let pref;
  let defaults;
  global.pref = {};

  try {
    const yml = fs.readFileSync(`${global.rootDir}/pref.yml`, enc);
    pref = global.pref = yaml.safeLoad(yml);
  }
  catch (err) {
    exports.error(err);
    exports.error(`${t('Missing or malformed %s!')} ${t('Exiting!')}`, 'pref.yml');

    return;
  }

  try {
    const yml = fs.readFileSync(`${global.appDir}/excludes/pref.yml`, enc);
    defaults = yaml.safeLoad(yml);

    // Better to leave this blank than to write the overly specific path in the default pref.yml.
    delete defaults.instance_file;
  }
  catch (err) {
    exports.error(err);
    exports.error(`${t('Missing or malformed %s!')} ${t('Exiting!')}`, 'excludes/pref.yml');

    return;
  }

  exports.extendButNotOverride(pref, defaults);

  // Turn relative path into absolute path.
  // Using exports.pathResolve() in case there are double-dots in these prefs or confs.
  // It is reasonable to assume that some projects will refer to a backend_dir outside of Fepper with double-dots and
  // that the maintainers would want this path to be version-controlled. Therefore, it should be a pref.
  if (pref.backend.backend_dir) {
    pref.backend.backend_dir = exports.pathResolve(global.rootDir, pref.backend.backend_dir);
  }

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
      // eslint-disable-next-line quotes
      throw new Error(`${t("fepper-utils deepGet() requires a valid path parameter, e.g. deepGet(nest, 'egg.yolk')")}`);
    }
    catch (err) {
      exports.error(err);
    }

    return obj;
  }

  if (!(obj instanceof Object)) {
    return null;
  }

  return pathElements.reduce(
    (accumulatedObj, pathElement) =>
      (accumulatedObj && accumulatedObj[pathElement]) ? accumulatedObj[pathElement] : null,
    obj
  );
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
    const source = objects[i] || {};

    for (const key of Object.keys(source)) {
      try {

        // Only recurse if source[key] is a plain instanceof Object.
        // Arrays and any other instanceof Object will not get recursed into. No real benefits exists for managing the
        // complexity wrought by their special properties, like .length, etc. They will be copied by reference in the
        // following else if block.
        // There is no check to determine whether target[key] is a non-plain instanceof Object. In such cases, it might
        // get additional properties. The object will work like any other complex object, but end-users will have to be
        // responsible for any unexpected behavior.
        if (source[key].constructor === Object) {

          // Create target[key] if undefined and source[key] is defined.
          // eslint-disable-next-line eqeqeq
          if (target[key] == null) {
            target[key] = {};
          }

          target[key] = exports.extendButNotOverride(target[key], source[key]);
        }

        // Pop when recursion meets anything other than a plain instanceof Object.
        // Only copy if target[key] is undefined or null. This way, target[key] is not overriden, only extended.
        // eslint-disable-next-line eqeqeq
        else if (target[key] == null) {
          target[key] = source[key];
        }
      }
      catch {

        // The most likely reason for getting here is that target[key] is set, but not an instanceof Object.
        // This will silently fail and continue if that is the case.
        // Nonetheless, we'll include this next block in the unlikely event that target[key] is undefined or null.
        // eslint-disable-next-line eqeqeq
        if (target[key] == null) {
          target[key] = source[key];
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
  let i = a.length;

  while (i > 1) {
    i--;
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
};

/**
 * More efficient global string replace than String.prototype.replace.
 *
 * @param {string} haystack - Full string to be modified.
 * @param {string} needle - The substring to be replaced.
 * @param {string} replacement - The substring to replace `needle`.
 * @returns {string} Modified full string.
 */
exports.strReplaceGlobal = (haystack, needle, replacement) => {
  let haystackNew = haystack;
  let needleIndex = needle ? haystackNew.indexOf(needle) : -1;

  while (needleIndex > -1) {
    haystackNew = haystackNew.substring(0, needleIndex) +
      replacement +
      haystackNew.substring(needleIndex + needle.length);

    needleIndex = haystackNew.indexOf(needle);
  }

  return haystackNew;
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
    const backendDirPref = global.pref.backend.backend_dir;
    const backendDirTrimmed = backendDir.trim();
    let fullPath;
    let stat;

    if (backendDirTrimmed.indexOf(backendDirPref) === 0) {
      fullPath = backendDirTrimmed;
    }
    else {
      fullPath = `${backendDirPref}/${backendDirTrimmed}`;
    }

    try {
      stat = fs.statSync(fullPath);
    }
    catch {} // eslint-disable-line no-empty

    if (stat && stat.isDirectory()) {
      return fullPath;
    }
  }

  return '';
};

/**
 * Recursively empty a directory of files, but not nested directories.
 *
 * @param {string} dirToEmpty - Directory to empty.
 */
exports.rmRfFilesNotDirs = (dirToEmpty) => {
  if (!fs.existsSync(dirToEmpty)) {
    return;
  }

  const files = fs.readdirSync(dirToEmpty);

  for (let i = 0, l = files.length; i < l; i++) {
    const file = `${dirToEmpty}/${files[i]}`;
    const stat = fs.statSync(file);

    if (stat.isDirectory()) {
      exports.rmRfFilesNotDirs(file);
    }
    else {
      fs.removeSync(file);
    }
  }
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

    exports.error(`${t('%s extension contains invalid characters!')}`, ext);
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

  // Need to accept different operating system path separators, so use Node path methods before running though slash.
  let workDirUp = slash(path.normalize(path.join(workDir, '..')));

  // Strip Windows drive letter where applicable.
  workDirUp = workDirUp.replace(/^[A-Z]:/, '');

  const workDirUpFiles = fs.readdirSync(workDirUp);
  let dirMatch = '';

  if (workDirUpFiles.indexOf(filename) > -1) {
    return workDirUp;
  }
  else if (workDirUp === '/' || workDirUp === workDir) {
    return '';
  }
  else {
    dirMatch = exports.findup(filename, workDirUp);
  }

  return dirMatch;
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
    exports.error(`${t('Missing or malformed %s!')}`, 'paths.source');
    throw new Error('ENOENT');
  }

  if (!uiObj.paths.public) {
    exports.error(`${t('Missing or malformed %s!')}`, 'paths.public');
    throw new Error('ENOENT');
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

  for (const pathKey of Object.keys(pathsSource)) {
    let pathSource = pathsSource[pathKey];

    if (pathSource.slice(0, 2) === './') {
      pathSource = pathSource.slice(2);
    }

    if (pathSource.slice(-1) === '/') {
      pathSource = pathSource.slice(0, -1);
    }

    if (pathSource.indexOf(workDir) !== 0) {
      uiObj.pathsRelative.source[pathKey] = pathSource;
      pathsSource[pathKey] = `${workDir}/${pathSource}`;
    }
  }

  for (const pathKey of Object.keys(pathsPublic)) {
    let pathPublic = pathsPublic[pathKey];

    if (pathPublic.slice(0, 2) === './') {
      pathPublic = pathPublic.slice(2);
    }

    if (pathPublic.slice(-1) === '/') {
      pathPublic = pathPublic.slice(0, -1);
    }

    if (pathPublic.indexOf(workDir) !== 0) {
      uiObj.pathsRelative.public[pathKey] = pathPublic;
      pathsPublic[pathKey] = `${workDir}/${pathPublic}`;
    }
  }

  // We also need paths relative to the public directory. This is so names for directories within the UI's document root
  // can be user-configured, and not hard-coded.
  uiObj.pathsPublic = uiObj.pathsPublic || {};
  const regex = new RegExp('^' + uiObj.pathsRelative.public.root + '\\/');

  for (const pathKey of Object.keys(uiObj.pathsRelative.public)) {
    if (pathKey === 'root') {
      continue;
    }

    uiObj.pathsPublic[pathKey] = uiObj.pathsRelative.public[pathKey].replace(regex, '');
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

  exports.console.error(...args);
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

  exports.console.info(...args);
};

/**
 * Abstract console.log to not trigger lint warnings/errors.
 *
 * @param {...*} args - Same arguments as console.log.
 */
exports.log = (...args) => {
  exports.console.log(...args);
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

  exports.console.warn(...args);
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
  const backendDirPref = global.pref.backend.backend_dir;

  for (let i = 0, l = webservedDirsFull.length; i < l; i++) {
    try {
      fs.copySync(
        `${backendDirPref}/${webservedDirsFull[i]}`,
        `${staticDir}/${webservedDirsShort[i]}`
      );
    }
    catch (err) {
      exports.error(err);

      continue;
    }
  }
};
