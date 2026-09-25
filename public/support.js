(function () {
  'use strict';

  const EVENT_NAMES = {
    onclick: 'click', onchange: 'change', onkeydown: 'keydown',
    ontouchstart: 'touchstart', ontouchend: 'touchend',
    onmousedown: 'mousedown', onmouseup: 'mouseup'
  };

  let component = null;
  let templateHTML = '';
  let mount = null;
  let rendering = false;

  function pathValue(path, context) {
    const clean = String(path || '').trim();
    if (!clean) return '';
    if (clean === 'true') return true;
    if (clean === 'false') return false;
    if (clean === 'null') return null;
    return clean.split('.').reduce((value, key) => value == null ? undefined : value[key], context);
  }

  function expressionValue(value, context) {
    const exact = String(value || '').match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/);
    return exact ? pathValue(exact[1], context) : value;
  }

  function interpolate(value, context) {
    return String(value == null ? '' : value).replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_, path) {
      const result = pathValue(path, context);
      return result == null ? '' : String(result);
    });
  }

  function renderNode(source, context) {
    if (source.nodeType === Node.TEXT_NODE) {
      const exact = source.nodeValue.match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/);
      if (exact) {
        const value = pathValue(exact[1], context);
        if (value && value.__dcElement) return buildElement(value);
      }
      return document.createTextNode(interpolate(source.nodeValue, context));
    }
    if (source.nodeType === Node.COMMENT_NODE) return source.cloneNode(true);
    if (source.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();

    const tag = source.tagName.toLowerCase();
    if (tag === 'sc-if') {
      const fragment = document.createDocumentFragment();
      if (expressionValue(source.getAttribute('value'), context)) {
        source.childNodes.forEach(function (child) { fragment.appendChild(renderNode(child, context)); });
      }
      return fragment;
    }
    if (tag === 'sc-for') {
      const fragment = document.createDocumentFragment();
      const list = expressionValue(source.getAttribute('list'), context) || [];
      const alias = source.getAttribute('as') || 'item';
      Array.from(list).forEach(function (item, index) {
        const childContext = Object.create(context);
        childContext[alias] = item;
        childContext.$index = index;
        source.childNodes.forEach(function (child) { fragment.appendChild(renderNode(child, childContext)); });
      });
      return fragment;
    }
    if (tag === 'helmet') {
      const fragment = document.createDocumentFragment();
      source.childNodes.forEach(function (child) { fragment.appendChild(renderNode(child, context)); });
      return fragment;
    }

    const element = document.createElement(tag);
    Array.from(source.attributes).forEach(function (attribute) {
      const name = attribute.name.toLowerCase();
      if (EVENT_NAMES[name]) {
        const handler = expressionValue(attribute.value, context);
        if (typeof handler === 'function') element.addEventListener(EVENT_NAMES[name], handler);
        return;
      }
      if (name === 'style-hover' || name.indexOf('hint-') === 0) return;
      const value = expressionValue(attribute.value, context);
      if (name === 'disabled' || name === 'checked' || name === 'selected') {
        element[name] = Boolean(value);
        if (value) element.setAttribute(name, '');
        return;
      }
      const rendered = interpolate(attribute.value, context);
      element.setAttribute(attribute.name, rendered);
      if (name === 'value' && 'value' in element) element.value = rendered;
    });
    source.childNodes.forEach(function (child) { element.appendChild(renderNode(child, context)); });
    return element;
  }

  function buildElement(description) {
    const element = document.createElement(description.tag);
    const props = description.props || {};
    Object.keys(props).forEach(function (key) {
      const value = props[key];
      if (key === 'style' && value && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key === 'className') {
        element.className = value;
      } else if (key !== 'children') {
        element.setAttribute(key, value);
      }
    });
    return element;
  }

  function render() {
    if (!component || !mount || rendering) return;
    rendering = true;
    const values = component.renderVals();
    const context = Object.assign(Object.create(null), values);
    const template = document.createElement('template');
    template.innerHTML = templateHTML;
    const fragment = document.createDocumentFragment();
    template.content.childNodes.forEach(function (node) { fragment.appendChild(renderNode(node, context)); });
    mount.replaceChildren(fragment);
    rendering = false;
  }

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(update) {
      const patch = typeof update === 'function' ? update(this.state, this.props) : update;
      this.state = Object.assign({}, this.state, patch || {});
      render();
    }
  }

  window.DCLogic = DCLogic;
  window.React = {
    createElement: function (tag, props) { return { __dcElement: true, tag: tag, props: props || {} }; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    const source = document.querySelector('x-dc');
    const logic = document.querySelector('script[data-dc-script]');
    if (!source || !logic) return;
    templateHTML = source.innerHTML;
    const propsSchema = JSON.parse(logic.getAttribute('data-props') || '{}');
    const props = {};
    Object.keys(propsSchema).forEach(function (key) { props[key] = propsSchema[key].default; });
    (0, eval)(logic.textContent + '\nwindow.__DCComponent = Component;');
    component = new window.__DCComponent(props);
    mount = document.createElement('div');
    mount.id = 'dc-app';
    source.replaceWith(mount);
    render();
    if (typeof component.componentDidMount === 'function') component.componentDidMount();
  });
})();
