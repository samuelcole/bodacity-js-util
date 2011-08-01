(function () {

  /*
   * Canonical URL creator.
   *
   * Given a URL (e.g., window.location.href or a relative URL such as
   * "/search"), returns a canonical URL so that both can be compared.
   *
   * Also provided is a helper method for that purpose: url_equals(). So on the
   * page "http://example.com/search", url_equals("/search", window.location)
   * will return true.
   *
   * See: http://www.ietf.org/rfc/rfc1808.txt Relative Uniform Resource Locators
   *
   * --
   * Bodacity JavaScript Utilities
   * http://adamhooper.com/bodacity
   * Public Domain (no licensing restrictions)
   */

  function dirname(filename) {
    // Assume the filename is of the form "/a/b/c" (and return "/a/b").
    var i = filename.lastIndexOf('/');
    if (i > 0) {
      return filename.substring(0, i);
    } else {
      return '/';
    }
  }

  var base,
    relative,

    // http://www.ietf.org/rfc/rfc1808.txt "Step 6"
    RE_CLEAN_PATH_DOT_SLASHES = /\/\.\//g,
    RE_CLEAN_PATH_DOT_AT_END = /\/\.$/,
    RE_CLEAN_PATH_DOTDOT = /[^\/]+\/\.\.\//,
    RE_CLEAN_PATH_DOTDOT_AT_END = /[^\/]+\/\.\.$/,

    RE_CLEAN_URL = /^(\w+):\/\/([^:\/]+)?(:\d+)?([^\?#]*)(?:\?(\S+))?/,

    RE_PROTO = /^\w+:\/\//,
    RE_ALL_BUT_PATH = /^(\w+:\/\/[^\/]*)/;
  /*
   * Returns the base URL according to the <base> element.
   */
  function get_base(options) {
    if (options && options.base) { return dirname(options.base); }

    if (base === undefined) {
      var base_elem = document.getElementsByTagName('base')[0];
      if (base_elem) {
        base = dirname(base_elem.href);
      } else {
        base = null;
      }
    }
    return base;
  }

  /*
   * Returns the base URL according to window.location.
   *
   * This will be the dirname of the current file.
   */
  function get_relative(options) {
    var loc, href;
    if (options && options.location) {
      loc = options.location;
    } else {
      loc = window.location;
    }

    href = loc.protocol;
    href += '//';
    href += loc.hostname;
    if (loc.port) {
      href += ':' + loc.port;
    }
    href += loc.pathname;
    href += loc.search;
    href += loc.hash;

    return dirname(href);
  }

  /*
   * Takes ":80" and returns either ":80" or "", depending on the value of proto.
   */
  function clean_port_with_proto(port, proto) {
    if (proto === 'http' && port === ':80') { return ''; }
    if (proto === 'https' && port === ':443') { return ''; }
    if (proto === 'ftp' && port === ':21') { return ''; }
    return port || '';
  }

  /*
   * Takes "//a" and returns "/a"; takes "" and returns "/".
   */
  function clean_path(path) {
    if (!path) { return '/'; }
    while (RE_CLEAN_PATH_DOT_SLASHES.test(path)) {
      path = path.replace(RE_CLEAN_PATH_DOT_SLASHES, '/');
    }
    path = path.replace(RE_CLEAN_PATH_DOT_AT_END, '/');
    while (RE_CLEAN_PATH_DOTDOT.test(path)) {
      path = path.replace(RE_CLEAN_PATH_DOTDOT, '');
    }
    path = path.replace(RE_CLEAN_PATH_DOTDOT_AT_END, '');
    return path;
  }

  function clean_url(url, options) {
    var match = RE_CLEAN_URL.exec(url),
      proto = match[1],
      host = match[2] || '',
      port = clean_port_with_proto(match[3], proto),
      path = clean_path(match[4]),
      query = match[5],
      clean = proto + '://' + host + port + path;

    if (options && options.include_query && query) {
      clean += '?' + query;
    }

    return clean;
  }

  function canonical_url(url, options) {

    if (RE_PROTO.test(url)) {
      return clean_url(url);
    }

    var start = get_base(options) || get_relative(options),
      all_but_path_match;


    if (url[0] === '/') {
      all_but_path_match = RE_ALL_BUT_PATH.exec(start);
      return clean_url(all_but_path_match[1] + url, options);
    }


    return clean_url(start + '/' + url, options);
  }

  function url_equals(url1, url2, options) {
    return canonical_url(url1, options) === canonical_url(url2, options);
  }

  window.canonical_url = canonical_url;
  window.url_equals = url_equals;

}());
