/* H-frame site script: phone menu, keyboard-friendly drop-downs,
   and the photo viewer. Plain JavaScript, no outside services. */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---------- Menus ---------- */
  function initMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    // Phone menu: a button beside each item that has a sub-menu.
    Array.prototype.forEach.call(nav.querySelectorAll('li.has-sub'), function (li) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'submenu-toggle';
      b.setAttribute('aria-expanded', 'false');
      var label = li.firstElementChild ? li.firstElementChild.textContent.trim() : '';
      b.setAttribute('aria-label', 'Show ' + label + ' pages');
      li.insertBefore(b, li.querySelector('ul'));
      b.addEventListener('click', function () {
        var open = li.classList.toggle('open');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      // Keep the branch with the current page open.
      if (li.querySelector('li.current')) {
        li.classList.add('open');
        b.setAttribute('aria-expanded', 'true');
      }
    });

    // Desktop: items without their own page open their menu on Enter.
    Array.prototype.forEach.call(nav.querySelectorAll('.nav-label'), function (s) {
      s.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var first = s.parentNode.querySelector('ul a');
          if (first) first.focus();
        }
      });
    });
  }

  /* ---------- Photo viewer ---------- */
  function initViewer() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('a[rel^="lightbox"]'));
    if (!links.length) return;

    var box = document.createElement('div');
    box.id = 'photo-viewer';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML =
      '<button class="viewer-close" type="button" aria-label="Close">&times;</button>' +
      '<button class="viewer-prev" type="button" aria-label="Previous photo">&#8249;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="viewer-next" type="button" aria-label="Next photo">&#8250;</button>' +
      '<div class="viewer-count" aria-live="polite"></div>';
    document.body.appendChild(box);
    var img = box.querySelector('img');
    var cap = box.querySelector('figcaption');
    var count = box.querySelector('.viewer-count');
    var prev = box.querySelector('.viewer-prev');
    var next = box.querySelector('.viewer-next');
    var group = [], index = 0, lastFocus = null;

    function captionFor(a) {
      var t = a.getAttribute('title') || '';
      if (!t) {
        var fig = a.closest('figure');
        var c = fig && fig.querySelector('figcaption');
        if (c) t = c.textContent.trim();
      }
      return t;
    }
    function render() {
      var a = group[index];
      img.src = a.getAttribute('href');
      var inner = a.querySelector('img');
      img.alt = (inner && inner.alt) || '';
      var c = captionFor(a);
      cap.textContent = c;
      cap.style.display = c ? '' : 'none';
      var many = group.length > 1;
      prev.style.display = next.style.display = many ? '' : 'none';
      count.textContent = many ? (index + 1) + ' / ' + group.length : '';
    }
    function open(a) {
      var rel = a.getAttribute('rel');
      group = rel === 'lightbox' ? [a] :
        links.filter(function (l) { return l.getAttribute('rel') === rel; });
      index = Math.max(0, group.indexOf(a));
      lastFocus = document.activeElement;
      render();
      box.classList.add('open');
      document.documentElement.classList.add('viewer-open');
      box.querySelector('.viewer-close').focus();
    }
    function close() {
      box.classList.remove('open');
      document.documentElement.classList.remove('viewer-open');
      img.removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    }
    function step(d) {
      index = (index + d + group.length) % group.length;
      render();
    }
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        open(a);
      });
    });
    box.querySelector('.viewer-close').addEventListener('click', close);
    prev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(box.querySelectorAll('button'),
          function (b) { return b.style.display !== 'none'; });
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null || group.length < 2) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }

  ready(function () { initMenu(); initViewer(); });
})();
