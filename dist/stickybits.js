/**
  stickybits - Stickybits is a lightweight alternative to `position: sticky` polyfills
  @version v3.0.4
  @link https://github.com/dollarshaveclub/stickybits#readme
  @author Jeff Wainwright <yowainwright@gmail.com> (https://jeffry.in)
  @license MIT
**/
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.stickybits = factory());
}(this, (function () { 'use strict';

/*
  STICKYBITS 💉
  --------
  > a lightweight alternative to `position: sticky` polyfills 🍬
  --------
  - each method is documented above it our view the readme
  - Stickybits does not manage polymorphic functionality (position like properties)
  * polymorphic functionality: (in the context of describing Stickybits)
    means making things like `position: sticky` be loosely supported with position fixed.
    It also means that features like `useStickyClasses` takes on styles like `position: fixed`.
  --------
  defaults 🔌
  --------
  - version = `package.json` version
  - userAgent = viewer browser agent
  - target = DOM element selector
  - noStyles = boolean
  - offset = number
  - parentClass = 'string'
  - scrollEl = window || DOM element selector
  - stickyClass = 'string'
  - stuckClass = 'string'
  - useStickyClasses = boolean
  - verticalPosition = 'string'
  --------
  props🔌
  --------
  - p = props {object}
  --------
  instance note
  --------
  - stickybits parent methods return this
  - stickybits instance methods return an instance item
  --------
  nomenclature
  --------
  - target => el => e
  - props => o || p
  - instance => item => it
  --------
  methods
  --------
  - .definePosition = defines sticky or fixed
  - .addInstance = an array of objects for each Stickybits Target
  - .getClosestParent = gets the parent for non-window scroll
  - .computeScrollOffsets = computes scroll position
  - .toggleClasses = older browser toggler
  - .manageState = manages sticky state
  - .removeClass = older browser support class remover
  - .removeInstance = removes an instance
  - .cleanup = removes all Stickybits instances and cleans up dom from stickybits
*/
function Stickybits(target, obj) {
  var o = typeof obj !== 'undefined' ? obj : {};
  this.version = '"3.0.4"';
  this.userAgent = window.navigator.userAgent || 'no `userAgent` provided by the browser';
  this.props = {
    noStyles: o.noStyles || false,
    stickyBitStickyOffset: o.stickyBitStickyOffset || 0,
    parentClass: o.parentClass || 'js-stickybit-parent',
    scrollEl: document.querySelector(o.scrollEl) || window,
    stickyClass: o.stickyClass || 'js-is-sticky',
    stuckClass: o.stuckClass || 'js-is-stuck',
    additionalClasses: o.additionalClasses || {},
    useStickyClasses: o.useStickyClasses || false,
    verticalPosition: o.verticalPosition || 'top'
  };
  var p = this.props;
  /*
    define positionVal
    ----
    -  uses a computed (`.definePosition()`)
    -  defined the position
  */
  p.positionVal = this.definePosition() || 'fixed';
  p.paddingPosition = p.verticalPosition === 'top' ? 'paddingTop' : 'paddingBottom';
  var vp = p.verticalPosition;
  var ns = p.noStyles;
  var pv = p.positionVal;
  this.els = typeof target === 'string' ? document.querySelectorAll(target) : target;
  if (!('length' in this.els)) this.els = [this.els];
  this.instances = [];
  for (var i = 0; i < this.els.length; i += 1) {
    var el = this.els[i];
    var styles = el.style;
    // set vertical position
    styles[vp] = vp === 'top' && !ns ? p.stickyBitStickyOffset + 'px' : '';
    styles.position = pv !== 'fixed' ? pv : '';
    if (pv === 'fixed' || p.useStickyClasses) {
      var instance = this.addInstance(el, p);
      // instances are an array of objects
      this.instances.push(instance);
    }
  }
  return this;
}

/*
  setStickyPosition ✔️
  --------
  —  most basic thing stickybits does
  => checks to see if position sticky is supported
  => defined the position to be used
  => stickybits works accordingly
*/
Stickybits.prototype.definePosition = function () {
  var prefix = ['', '-o-', '-webkit-', '-moz-', '-ms-'];
  var test = document.head.style;
  for (var i = 0; i < prefix.length; i += 1) {
    test.position = prefix[i] + 'sticky';
  }
  var stickyProp = test.position ? test.position : 'fixed';
  test.position = '';
  return stickyProp;
};

/*
  addInstance ✔️
  --------
  — manages instances of items
  - takes in an el and props
  - returns an item object
  ---
  - target = el
  - o = {object} = props
    - scrollEl = 'string'
    - verticalPosition = number
    - off = boolean
    - parentClass = 'string'
    - stickyClass = 'string'
    - stuckClass = 'string'
  ---
  - defined later
    - parent = dom element
    - state = 'string'
    - offset = number
    - stickyStart = number
    - stickyStop = number
  - returns an instance object
*/
Stickybits.prototype.addInstance = function addInstance(el, props) {
  var _this = this;

  var item = {
    el: el,
    parent: el.parentNode,
    props: props
  };
  this.isWin = this.props.scrollEl === window;
  var se = this.isWin ? window : this.getClosestParent(item.el, item.props.scrollEl);
  item.parent.className += ' ' + props.parentClass;
  item.state = 'default';
  item.stateContainer = function () {
    _this.computeScrollOffsets(item);
    _this.manageState(item);
  };
  this.computeScrollOffsets(item);
  this.manageState(item);
  se.addEventListener('scroll', item.stateContainer);
  return item;
};

/*
  --------
  getParent 👨‍
  --------
  - a helper function that gets the target element's parent selected el
  - only used for non `window` scroll elements
  - supports older browsers
*/
Stickybits.prototype.getClosestParent = function (el, match) {
  // p = parent element
  var p = match;
  var e = el;
  if (e.parentElement === p) return p;
  // traverse up the dom tree until we get to the parent
  while (e.parentElement !== p) {
    e = e.parentElement;
  } // return parent element
  return p;
};

/*
  computeScrollOffsets 📊
  ---
  computeScrollOffsets for Stickybits
  - defines
    - offset
    - start
    - stop
*/
Stickybits.prototype.computeScrollOffsets = function computeScrollOffsets(item) {
  var it = item;
  var p = it.props;
  var parent = it.parent;
  var ac = p.additionalClasses;
  var scroll = p.scrollEl === window ? p.scrollEl.scrollY || p.scrollEl.pageYOffset : p.scrollEl.scrollTop;
  var isCustom = p.scrollEl !== window && p.positionVal === 'fixed';
  var isBottom = p.verticalPosition !== 'bottom';
  var scrollElOffset = isCustom ? p.scrollEl.getBoundingClientRect().top : 0;
  var stickyStart = isCustom ? parent.getBoundingClientRect().top - scrollElOffset : parent.getBoundingClientRect().top + scroll;
  it.offset = scrollElOffset + p.stickyBitStickyOffset;
  it.stickyStart = isBottom ? stickyStart - it.offset : 0;
  it.stickyStop = isBottom ? stickyStart + parent.offsetHeight - (it.el.offsetHeight + it.offset) : stickyStart + parent.offsetHeight;

  it.additionalClasses = {};
  Object.keys(ac).forEach(function (cls) {
    it.additionalClasses[cls] = {
      threshold: stickyStart + ac[cls]
    };
  });

  return it;
};

/*
  toggleClasses ⚖️
  ---
  toggles classes (for older browser support)
  r = removed class
  a = added class
*/
Stickybits.prototype.toggleClasses = function (el, r, a) {
  var e = el;
  var cArray = e.className.split(' ');
  if (a && cArray.indexOf(a) === -1) cArray.push(a);
  var rItem = cArray.indexOf(r);
  if (rItem !== -1) cArray.splice(rItem, 1);
  e.className = cArray.join(' ');
};

/*
  manageState 📝
  ---
  - defines the state
    - normal
    - sticky
    - stuck
*/
Stickybits.prototype.manageState = function manageState(item) {
  // cache object
  var it = item;
  var e = it.el;
  var p = it.props;
  var parent = it.parent;
  var pstl = parent.style;
  var state = it.state;
  var stl = e.style;
  var ac = it.additionalClasses;
  // cache props
  var ns = p.noStyles;
  var pv = p.positionVal;
  var se = p.scrollEl;
  var sticky = p.stickyClass;
  var stuck = p.stuckClass;
  var vp = p.verticalPosition;
  var pp = p.paddingPosition;
  /*
    requestAnimationFrame
    ---
    - use rAF
    - or stub rAF
  */
  var rAFStub = function rAFDummy(f) {
    f();
  };
  var rAF = !this.isWin ? rAFStub : window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || rAFStub;

  /*
    define scroll vars
    ---
    - scroll
    - toSticky
    - toDefault
    - toStuck
    - isSticky
  */
  var tC = this.toggleClasses;
  var cO = this.computeScrollOffsets;
  var scroll = this.isWin || se.getBoundingClientRect().top ? window.scrollY || window.pageYOffset : se.scrollTop;
  /*
    Unnamed arrow functions within this block
    ---
    - help wanted or discussion
    - view test.stickybits.js
      - `stickybits .manageState  `position: fixed` interface` for more awareness 👀
  */
  rAF(function () {
    cO(it);
    var start = it.stickyStart;
    var stop = it.stickyStop;

    var toSticky = scroll > start && scroll < stop && (state === 'default' || state === 'stuck');
    var toDefault = scroll <= start && state === 'sticky';
    var toStuck = scroll >= stop && state === 'sticky';
    var isSticky = scroll > start && scroll < stop && state === 'sticky';

    if (toSticky) {
      it.state = 'sticky';
      tC(e, stuck, sticky);
      stl.position = pv;
      if (ns) return;
      stl.bottom = '';
      stl[vp] = p.stickyBitStickyOffset + 'px';
      if (pv === 'fixed') pstl[pp] = e.clientHeight + 'px';
    } else if (toDefault) {
      it.state = 'default';
      tC(e, sticky);
      if (pv !== 'fixed' || ns) return;
      stl.position = '';
      pstl[pp] = '';
    } else if (toStuck) {
      it.state = 'stuck';
      tC(e, sticky, stuck);
      if (pv !== 'fixed' || ns) return;
      stl.top = '';
      stl.bottom = '0';
      stl.position = 'absolute';
      pstl[pp] = e.clientHeight + 'px';
    } else if (isSticky) {
      // update the padding based on the height of the item
      if (pv === 'fixed') pstl[pp] = e.clientHeight + 'px';
    }

    if (Object.keys(ac).length) {
      Object.keys(ac).forEach(function (cls) {
        if (scroll >= ac[cls].threshold) {
          tC(e, null, cls);
        } else {
          tC(e, cls);
        }
      });
    }
  });

  return it;
};

/*
  removes an instance 👋
  --------
  - cleanup instance
*/
Stickybits.prototype.removeInstance = function removeInstance(instance) {
  var e = instance.el;
  var p = instance.props;
  var ac = instance.additionalClasses;
  var tC = this.toggleClasses;
  e.style.position = '';
  e.style[p.verticalPosition] = '';
  tC(e, p.stickyClass);
  tC(e, p.stuckClass);
  tC(e.parentNode, p.parentClass);
  Object.keys(ac).forEach(function (cls) {
    tC(e, cls);
  });
};

/*
  cleanup 🛁
  --------
  - cleans up each instance
  - clears instance
*/
Stickybits.prototype.cleanup = function cleanup() {
  for (var i = 0; i < this.instances.length; i += 1) {
    var instance = this.instances[i];
    instance.props.scrollEl.removeEventListener('scroll', instance.stateContainer);
    this.removeInstance(instance);
  }
  this.manageState = false;
  this.instances = [];
};

/*
  export
  --------
  exports StickBits to be used 🏁
*/
function stickybits(target, o) {
  return new Stickybits(target, o);
}

return stickybits;

})));
