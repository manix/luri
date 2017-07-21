"use strict";

(function(root) {

  var luri = {
    construct: (function() {
      var special_props = ["node", "html", "ref"];

      return function(input) {
        var props;

        if (typeof input === "string" || typeof input === "number") {
          return document.createTextNode(input);
        } else if (Array.isArray(input)) {
          props = { html: input };
        } else if (input instanceof this.Component) {
          if (input.ref) {
            return input.ref;
          }
          props = input.props();
          props.ref = luri.Component.prototype.bind;
        } else {
          props = input;
        }

        props = Object.assign({}, props);

        var element = document.createElement(props.node || "div");
        var html = props.html || [];
        var ref = props.ref;

        var i = special_props.length;
        while (i--) {
          delete(props[special_props[i]]);
        }

        for (var prop in props) {
          var value = props[prop];

          if (typeof value === "function" && prop.indexOf("on") === 0) {
            element[prop] = value;
          } else {
            element.setAttribute(prop, value);
          }
        }

        if (html) {
          if (Array.isArray(html)) {
            for (var i = 0, l = html.length; i < l; i++) {
              element.appendChild(this.construct(html[i]));
            }
          } else {
            element.appendChild(this.construct(html));
          }
        }

        if (ref) {
          ref.call(input, element);
        }

        return element;
      }
    })(),
    Component: class Component {

      constructor() {
        this._li = {};
        this.ref = null;
      }

      bind(element) {
        this.ref = element;
        element.luri = this
        element.classList.add(luri.class);
      }

      construct() {
        return luri.construct(this);
      }

      reconstruct() {
        if (!this.ref) {
          throw "Can not reconstruct a component that has not been constructed yet.";
        }

        var old = this.ref;

        // construct() will return this.ref if it is defined, so assign null first
        this.ref = null;

        this.bind(this.construct());

        if (old.parentNode) {
          old.parentNode.replaceChild(this.ref, old);
        }

        return old;
      }

      cut(property) {
        var value = this[property];
        delete(this[property]);
        return value;
      }

      getEventListeners(event) {
        if (!this._li[event]) {
          this._li[event] = [];
        }

        return this._li[event];
      }

      on(event, listener) {
        this.getEventListeners(event).push(listener);
      }

      off(event, listener) {
        return this.removeEventListener(event, listener);
      }

      removeEventListener(event, listener) {
        this._li[event] = this.getEventListeners(event).filter(l => l !== listener);
      }

      isMounted() {
        return document.documentElement.contains(this.ref);
      }

      props() {
        return {};
      }
    },
    class: "luri-" + Math.random().toString(36).substring(2, 6),
    emit: function(event, ...data) {
      return luri.dispatchTo(document.getElementsByClassName(luri.class), event, ...data);
    },
    dispatchToClass(className, event, ...data) {
      return luri.dispatchTo(document.getElementsByClassName(className), event, ...data);
    },
    dispatchTo(collection, event, ...data) {
      var l = collection.length;
      while (l--) {
        let component = collection[l].luri;

        if (component) {
          component.getEventListeners(event).forEach(listener => listener.call(component, ...data));
        }
      }

      return data;
    }
  };

  (function() {
    var shorthand = function(props) {
      if (!props || typeof props === "number" || typeof props === "string" || Array.isArray(props) || props.node) {
        props = { node: this, html: props };
      } else {
        props.node = this;
      }

      return props;
    };

    ["A", "ABBR", "ADDRESS", "AREA", "ARTICLE", "ASIDE", "AUDIO", "B", "BASE", "BDI", "BDO",
    "BLOCKQUOTE", "BODY", "BR", "BUTTON", "CANVAS", "CAPTION", "CITE", "CODE", "COL",
    "COLGROUP", "DATA", "DATALIST", "DD", "DEL", "DETAILS", "DFN", "DIALOG", "DIV", "DL",
    "DT", "EM", "EMBED", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2",
    "H3", "H4", "H5", "H6", "HEAD", "HEADER", "HGROUP", "HR", "HTML", "I", "IFRAME", "IMG",
    "INPUT", "INS", "KBD", "KEYGEN", "LABEL", "LEGEND", "LI", "LINK", "MAIN", "MAP", "MARK",
    "MATH", "MENU", "MENUITEM", "META", "METER", "NAV", "NOSCRIPT", "OBJECT", "OL",
    "OPTGROUP", "OPTION", "OUTPUT", "P", "PARAM", "PICTURE", "PRE", "PROGRESS", "Q",
    "RB", "RP", "RT", "RTC", "RUBY", "S", "SAMP", "SCRIPT", "SECTION", "SELECT", "SLOT",
    "SMALL", "SOURCE", "SPAN", "STRONG", "STYLE", "SUB", "SUMMARY", "SUP", "SVG", "TABLE",
    "TBODY", "TD", "TEMPLATE", "TEXTAREA", "TFOOT", "TH", "THEAD", "TIME", "TITLE", "TR",
    "TRACK", "U", "UL", "VAR", "VIDEO", "WBR"].forEach(tag => luri[tag] = shorthand.bind(tag));
  })();

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = luri;
    }
    exports.mymodule = luri;
  } else {
    root.luri = luri;
  }

})(this);
