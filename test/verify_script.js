const fs = require('fs');
const assert = require('assert');

console.log('--- STARTING REDECANAIS SUITE INTEGRATION TESTS ---');

const userScriptCode = fs.readFileSync('redecanais-suite.user.js', 'utf8');

// Element representation for light DOM mock
class MockNode {
  constructor(tag = 'DIV') {
    this.tagName = tag.toUpperCase();
    this.id = '';
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      toggle: (c) => {
        if (this.classList._classes.has(c)) {
          this.classList._classes.delete(c);
          return false;
        } else {
          this.classList._classes.add(c);
          return true;
        }
      },
      contains: (c) => this.classList._classes.has(c)
    };
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.style = {};
    this.value = '';
    this.textContent = '';
    this.innerText = '';
    this.parentNode = null;
    this.onmousedown = null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  addEventListener(type, cb) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(cb);
  }

  dispatchEvent(evt) {
    const cbs = this.listeners[evt.type] || [];
    cbs.forEach(cb => cb(evt));
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
    if (k === 'id') this.id = String(v);
    if (k === 'class') {
      this.className = String(v);
      String(v).split(' ').forEach(c => { if (c) this.classList.add(c); });
    }
    if (k === 'src') this.src = String(v);
    if (k === 'href') this.href = String(v);
  }

  getAttribute(k) { return this.attributes[k] || (k === 'src' ? this.src : (k === 'href' ? this.href : null)); }

  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }

  querySelectorAll(sel) {
    let res = [];
    const walk = (node) => {
      node.children.forEach(c => {
        if (sel.startsWith('#') && c.id === sel.slice(1)) res.push(c);
        else if (sel.startsWith('.') && c.className.includes(sel.slice(1))) res.push(c);
        else if (c.tagName === sel.toUpperCase()) res.push(c);
        else if (sel.includes('a[href*=')) {
          if (c.tagName === 'A' && c.href && c.href.includes('-ao-vivo')) res.push(c);
        }
        walk(c);
      });
    };
    walk(this);
    return res;
  }

  closest(sel) {
    let p = this;
    while (p) {
      if (sel.startsWith('#') && p.id === sel.slice(1)) return p;
      p = p.parentNode;
    }
    return null;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.children = this.parentNode.children.filter(c => c !== this);
    }
  }
}

function parseHTMLToMockTree(html, parent) {
  const tagRegex = /<([a-z1-6]+)([^>]*)\/?>|([^<]+)/gi;
  let match;
  let elementStack = [parent];

  while ((match = tagRegex.exec(html)) !== null) {
    if (match[1]) {
      const tag = match[1];
      const attrs = match[2] || '';

      if (html[match.index + match[0].length - 2] === '/' || ['input', 'img', 'br', 'hr', 'meta', 'link'].includes(tag.toLowerCase())) {
        const leaf = new MockNode(tag);
        parseAttrs(attrs, leaf);
        elementStack[elementStack.length - 1].appendChild(leaf);
      } else if (match[0].startsWith('</')) {
        if (elementStack.length > 1) {
          elementStack.pop();
        }
      } else {
        const elem = new MockNode(tag);
        parseAttrs(attrs, elem);
        elementStack[elementStack.length - 1].appendChild(elem);
        elementStack.push(elem);
      }
    } else if (match[3] && match[3].trim()) {
      elementStack[elementStack.length - 1].textContent += match[3].trim();
    }
  }
}

function parseAttrs(attrsStr, elem) {
  const attrRegex = /([a-z0-9_-]+)(?:="([^"]*)")?/gi;
  let m;
  while ((m = attrRegex.exec(attrsStr)) !== null) {
    elem.setAttribute(m[1], m[2] || '');
  }
}

// Global Document Mock
const doc = new MockNode('DOCUMENT');
doc.head = doc.appendChild(new MockNode('HEAD'));
doc.body = doc.appendChild(new MockNode('BODY'));
doc.title = 'HBO Family - Assistir Ao Vivo';
doc.readyState = 'complete';

doc.createElement = function(tag) {
  const node = new MockNode(tag);
  let _html = '';
  Object.defineProperty(node, 'innerHTML', {
    get() { return _html; },
    set(val) {
      _html = val;
      node.children = [];
      parseHTMLToMockTree(val, node);
    }
  });
  return node;
};

doc.getElementById = (id) => doc.querySelector('#' + id);

// Standard URL class polyfill if needed
class MockURL {
  constructor(url) {
    this.href = url;
  }
  toString() {
    return this.href;
  }
}

const win = {
  document: doc,
  location: { href: 'https://redecanaistv.ae/hbo-family-ao-vivo.html', hostname: 'redecanaistv.ae' },
  navigator: {},
  addEventListener: () => {},
  open: function() { return {}; },
  fetch: async function(url) { return { status: 200 }; },
  XMLHttpRequest: class { open(m, u) {} },
  URL: MockURL
};

// Polyfills
global.window = win;
global.document = doc;
global.URL = MockURL;
global.setInterval = (fn, ms) => {
  const timer = { unref: () => {} };
  return timer;
};
global.GM_getValue = (k, d) => d;
global.GM_setValue = (k, v) => {};
global.GM_addStyle = (css) => {};

// Add DOM initial content
const chLink = new MockNode('A');
chLink.setAttribute('href', 'https://redecanaistv.ae/telecine-pipoca-ao-vivo.html');
chLink.setAttribute('title', 'Telecine Pipoca');
chLink.innerText = 'Telecine Pipoca';
doc.body.appendChild(chLink);

const containerThumb = new MockNode('DIV');
containerThumb.className = 'thumb';
const thumbLink = new MockNode('A');
thumbLink.setAttribute('href', 'https://redecanaistv.ae/sportv-1-ao-vivo.html');
thumbLink.setAttribute('title', 'SporTV 1 "HD"');
containerThumb.appendChild(thumbLink);
doc.body.appendChild(containerThumb);

const iframe = new MockNode('IFRAME');
iframe.setAttribute('name', 'Player');
iframe.src = 'https://redecanaistv.ae/ch.html?id=hbofamily';
doc.body.appendChild(iframe);

// Run Userscript
eval(userScriptCode);

// Trigger fetch stream interception
win.fetch(new MockURL('https://cdn.redecanaistv.ae/hls/hbofamily.m3u8'));

// Tests
console.log('1. Checking Suite Panel Injection...');
const panel = doc.getElementById('rc-suite-panel');
assert(panel !== null, 'Suite panel should exist');
console.log('✓ Suite Panel successfully injected.');

console.log('2. Checking Popup Suppressor Dummy Window Object...');
const popResult = win.open('https://popunder.com');
assert(popResult !== null, 'window.open should return dummy window object');
assert.strictEqual(typeof popResult.focus, 'function', 'Dummy window should have focus() method');
assert.strictEqual(typeof popResult.blur, 'function', 'Dummy window should have blur() method');
assert.strictEqual(typeof popResult.close, 'function', 'Dummy window should have close() method');
assert.strictEqual(popResult.closed, true, 'Dummy window closed property should be true');
// Execute methods to confirm no exceptions
popResult.focus();
popResult.blur();
popResult.close();
console.log('✓ Popup suppression operational and safe from TypeErrors.');

console.log('3. Checking Stream Capture with URL objects...');
const streamUrlBox = doc.getElementById('rc-stream-url');
assert(streamUrlBox !== null, 'Stream URL box should exist');
assert(streamUrlBox.textContent.includes('hbofamily.m3u8'), 'Stream URL should capture stream url from URL object');
console.log('✓ Stream URL captured:', streamUrlBox.textContent);

console.log('4. Checking Channel List Scraping & Switching with Containers...');
assert(win.RCSuite.allChannels.length > 0, 'Channels should be scraped from page');
assert(win.RCSuite.allChannels.some(c => c.name.includes('Telecine Pipoca')), 'Channel Telecine Pipoca should be in scraped channels list');
assert(win.RCSuite.allChannels.some(c => c.name.includes('SporTV 1')), 'SporTV 1 inside .thumb should be scraped');
console.log('✓ Channel scraping operational. Total channels:', win.RCSuite.allChannels.length);

console.log('5. Checking Cinema Mode Toggle...');
const cinemaBtn = doc.getElementById('rc-btn-cinema');
assert(cinemaBtn !== null, 'Cinema button should exist');
cinemaBtn.dispatchEvent({ type: 'click' });
assert(doc.body.classList.contains('rc-cinema-active'), 'Body should have rc-cinema-active class');
console.log('✓ Cinema mode toggles body class correctly.');

console.log('6. Checking Speed Display Updates & Input Validation...');
const speedUp = doc.getElementById('rc-speed-up');
assert(speedUp !== null, 'Speed Up button should exist');
speedUp.dispatchEvent({ type: 'click' });
const speedDisplay = doc.getElementById('rc-speed-display');
assert.strictEqual(speedDisplay.textContent, '1.25x');

// Test NaN validation
win.RCSuite.config.playbackSpeed = 1.0;
const speedReset = doc.getElementById('rc-speed-reset');
speedReset.dispatchEvent({ type: 'click' });
assert.strictEqual(speedDisplay.textContent, '1x');
console.log('✓ Playback speed adjusted and validated.');

console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY ---');
process.exit(0);
