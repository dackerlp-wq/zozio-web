;(function () {
  'use strict'

  // ── Find own script tag ───────────────────────────────────────────────────
  // document.currentScript is the most reliable method (works in all modern browsers).
  // Falls back to iterating scripts for environments that null it out (deferred/async).
  var self = document.currentScript || (function () {
    var all = document.querySelectorAll('script[src*="widget.js"]')
    return all.length ? all[all.length - 1] : null
  })()
  if (!self) return

  // ── Read config from data-* attributes ───────────────────────────────────
  var slug    = self.getAttribute('data-id')    || ''
  var type    = self.getAttribute('data-type')  || 'adopt'
  var limit   = parseInt(self.getAttribute('data-limit') || '6', 10)
  var theme   = self.getAttribute('data-theme') || (type === 'adopted' ? 'teal' : 'coral')
  var species = self.getAttribute('data-species') || ''
  var lang    = self.getAttribute('data-lang') || 'cs'

  if (!slug) return

  // ── Resolve base URL ─────────────────────────────────────────────────────
  // Always use the canonical www domain for API calls to avoid apex→www
  // 301 redirect which strips CORS headers and breaks cross-origin XHR.
  var baseUrl = 'https://www.zozio.cz'

  // ── i18n strings ──────────────────────────────────────────────────────────
  var i18n = {
    cs: {
      adopt_title:    'Hledají domov',
      adopted_title:  'Našli domov',
      available:      'K adopci',
      reserved:       'Rezervováno',
      adopted:        'Adoptován/a',
      adopted_on:     'Adoptován/a',
      found_at:       'Nalezen/a',
      see_all:        'Zobrazit na Zozio.cz',
      powered_by:     'Powered by',
      loading:        'Načítám...',
      error:          'Widget nelze načíst.',
      no_animals:     'Momentálně žádná zvířata.',
      male:           'Samec',
      female:         'Samice',
      unknown_sex:    '',
    },
    sk: {
      adopt_title:    'Hľadajú domov',
      adopted_title:  'Našli domov',
      available:      'Na adopciu',
      reserved:       'Rezervované',
      adopted:        'Adoptovaný/á',
      adopted_on:     'Adoptovaný/á',
      found_at:       'Nájdený/á',
      see_all:        'Zobraziť na Zozio.cz',
      powered_by:     'Powered by',
      loading:        'Načítavam...',
      error:          'Widget sa nedá načítať.',
      no_animals:     'Momentálne žiadne zvieratá.',
      male:           'Samec',
      female:         'Samica',
      unknown_sex:    '',
    },
  }
  var t = i18n[lang] || i18n.cs

  // ── Color themes ─────────────────────────────────────────────────────────
  var themes = {
    coral: { primary: '#E8634A', primaryLight: '#FDEAE6', primaryText: '#993C1D' },
    teal:  { primary: '#2E9E8F', primaryLight: '#E1F5EE', primaryText: '#0F6E56' },
  }
  var c = themes[theme] || themes.coral

  // ── Status badge styles ───────────────────────────────────────────────────
  var statusCfg = {
    available: { bg: '#FDEAE6', color: '#993C1D', label: t.available },
    reserved:  { bg: '#FAEEDA', color: '#854F0B', label: t.reserved  },
    adopted:   { bg: '#E1F5EE', color: '#0F6E56', label: t.adopted   },
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function fmtDate(iso) {
    if (!iso) return ''
    try {
      var d = new Date(iso)
      return d.toLocaleDateString(lang === 'sk' ? 'sk-SK' : 'cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
    } catch (e) {
      return iso.slice(0, 10)
    }
  }

  function fmtAge(years, months) {
    if (years === null || years === undefined) return ''
    if (years < 1) {
      var m = Math.round(months || 0)
      return m <= 1 ? '< 1 m.' : m + ' m.'
    }
    return years + (lang === 'sk' ? ' r.' : ' r.')
  }

  // ── CSS ───────────────────────────────────────────────────────────────────
  var CSS = [
    '*{box-sizing:border-box;margin:0;padding:0}',
    '.zw-wrap{font-family:system-ui,-apple-system,sans-serif;color:#2C1810;line-height:1.4}',
    '.zw-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}',
    '.zw-title{font-size:18px;font-weight:800;color:#2C1810}',
    '.zw-see-all{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:100px;',
    'background:' + c.primary + ';color:#fff;font-size:12px;font-weight:700;text-decoration:none;',
    'transition:opacity .15s;white-space:nowrap}',
    '.zw-see-all:hover{opacity:.85}',
    '.zw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}',
    '@media(max-width:700px){.zw-grid{grid-template-columns:repeat(2,1fr)}}',
    '@media(max-width:440px){.zw-grid{grid-template-columns:1fr}}',
    /* Card */
    '.zw-card{background:#fff;border-radius:14px;border:1.5px solid #F0EDE8;overflow:hidden;',
    'transition:transform .15s,box-shadow .15s,border-color .15s;cursor:pointer;text-decoration:none;display:block;color:inherit}',
    '.zw-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(44,24,16,.08);border-color:#E0D5CC}',
    /* Photo */
    '.zw-photo-wrap{position:relative;width:100%;padding-bottom:72%;background:#F5E6D3;overflow:hidden}',
    '.zw-photo-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
    '.zw-no-photo{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:36px}',
    /* Adopted overlay */
    '.zw-overlay{position:absolute;top:8px;left:8px;padding:3px 9px;border-radius:100px;',
    'background:' + c.primary + ';color:#fff;font-size:11px;font-weight:700;letter-spacing:.3px}',
    /* Body */
    '.zw-body{padding:11px 13px 13px}',
    '.zw-name{font-size:15px;font-weight:800;color:#2C1810;margin-bottom:3px;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.zw-meta{font-size:12px;color:#8B6550;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px;align-items:center}',
    '.zw-badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:100px;font-size:11px;font-weight:700}',
    '.zw-footer-row{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:8px}',
    '.zw-location{font-size:11px;color:#8B6550;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}',
    /* Skeleton */
    '.zw-skel{background:#F5E6D3;border-radius:14px;border:1.5px solid #F0EDE8;overflow:hidden;animation:zw-pulse 1.4s ease-in-out infinite}',
    '@keyframes zw-pulse{0%,100%{opacity:1}50%{opacity:.5}}',
    '.zw-skel-photo{width:100%;padding-bottom:72%;background:#EDD8C0}',
    '.zw-skel-body{padding:11px 13px 13px}',
    '.zw-skel-line{height:12px;border-radius:6px;background:#EDD8C0;margin-bottom:8px}',
    '.zw-skel-line.wide{width:80%}.zw-skel-line.mid{width:55%}.zw-skel-line.short{width:35%}',
    /* State */
    '.zw-state{text-align:center;padding:32px 16px;color:#8B6550;font-size:14px;font-weight:600}',
    /* Footer */
    '.zw-powered{margin-top:14px;text-align:center;font-size:11px;color:#8B6550}',
    '.zw-powered a{color:#8B6550;font-weight:700;text-decoration:none}',
    '.zw-powered a:hover{color:' + c.primary + '}',
  ].join('')

  // ── Create container and shadow DOM ───────────────────────────────────────
  var host = document.createElement('div')
  host.className = 'zozio-widget'
  self.parentNode.insertBefore(host, self.nextSibling)

  var shadow = host.attachShadow({ mode: 'open' })

  var styleEl = document.createElement('style')
  styleEl.textContent = CSS
  shadow.appendChild(styleEl)

  var wrap = document.createElement('div')
  wrap.className = 'zw-wrap'
  shadow.appendChild(wrap)

  // ── Render helpers ────────────────────────────────────────────────────────
  function renderSkeletons(n) {
    var html = '<div class="zw-grid">'
    for (var i = 0; i < n; i++) {
      html += '<div class="zw-skel">'
      html += '<div class="zw-skel-photo"></div>'
      html += '<div class="zw-skel-body">'
      html += '<div class="zw-skel-line wide"></div>'
      html += '<div class="zw-skel-line mid"></div>'
      html += '<div class="zw-skel-line short"></div>'
      html += '</div></div>'
    }
    html += '</div>'
    return html
  }

  function renderCard(animal, institutionSlug) {
    var animalUrl = baseUrl + '/zvire/' + esc(animal.slug || animal.id)
    var badge = statusCfg[animal.status] || statusCfg.available
    var age   = fmtAge(animal.age_years, animal.age_months)
    var isAdopted = animal.status === 'adopted'

    var metaParts = []
    if (animal.species)  metaParts.push((animal.species_icon ? animal.species_icon + ' ' : '') + esc(animal.species))
    if (age)             metaParts.push(esc(age))
    if (animal.breed)    metaParts.push(esc(animal.breed))

    var photoHtml = animal.primary_photo_url
      ? '<img src="' + esc(animal.primary_photo_url) + '" alt="' + esc(animal.name) + '" loading="lazy" />'
      : '<div class="zw-no-photo">' + esc(animal.species_icon || (type === 'adopt' ? '🐾' : '🦉')) + '</div>'

    var overlayHtml = isAdopted
      ? '<div class="zw-overlay">' + esc(t.adopted) + '</div>'
      : ''

    var locationHtml = ''
    if (isAdopted && animal.adopted_at) {
      locationHtml = '<span class="zw-location">' + esc(t.adopted_on) + ' ' + fmtDate(animal.adopted_at) + '</span>'
    } else if (animal.found_location) {
      locationHtml = '<span class="zw-location" title="' + esc(animal.found_location) + '">'
        + esc(t.found_at) + ': ' + esc(animal.found_location)
        + '</span>'
    }

    return '<a class="zw-card" href="' + esc(animalUrl) + '" target="_blank" rel="noopener">'
      + '<div class="zw-photo-wrap">' + photoHtml + overlayHtml + '</div>'
      + '<div class="zw-body">'
      + '<div class="zw-name">' + esc(animal.name) + '</div>'
      + (metaParts.length ? '<div class="zw-meta">' + metaParts.join(' &middot; ') + '</div>' : '')
      + '<div class="zw-footer-row">'
      + '<span class="zw-badge" style="background:' + badge.bg + ';color:' + badge.color + '">' + esc(badge.label) + '</span>'
      + locationHtml
      + '</div>'
      + '</div>'
      + '</a>'
  }

  function renderWidget(data) {
    var title = type === 'adopted' ? t.adopted_title : t.adopt_title
    var profileUrl = baseUrl + '/utulky/' + esc(data.institution.slug)

    var html = '<div class="zw-header">'
      + '<span class="zw-title">' + esc(title) + '</span>'
      + '<a class="zw-see-all" href="' + esc(profileUrl) + '" target="_blank" rel="noopener">🐾 ' + t.see_all + '</a>'
      + '</div>'

    if (!data.animals || data.animals.length === 0) {
      html += '<div class="zw-state">' + esc(t.no_animals) + '</div>'
    } else {
      html += '<div class="zw-grid">'
      for (var i = 0; i < data.animals.length; i++) {
        html += renderCard(data.animals[i], data.institution.slug)
      }
      html += '</div>'
    }

    html += '<div class="zw-powered">'
      + esc(t.powered_by) + ' <a href="' + esc(baseUrl) + '" target="_blank" rel="noopener">Zozio</a>'
      + '</div>'

    wrap.innerHTML = html
  }

  // ── Initial render: loading skeletons ────────────────────────────────────
  var skeletonCount = Math.min(limit, 3)
  wrap.innerHTML = renderSkeletons(skeletonCount)

  // ── Fetch data ────────────────────────────────────────────────────────────
  var apiUrl = baseUrl + '/api/widget/' + encodeURIComponent(slug)
    + '?type=' + encodeURIComponent(type)
    + '&limit=' + encodeURIComponent(String(limit))
    + (species ? '&species=' + encodeURIComponent(species) : '')

  function fetchData() {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', apiUrl, true)
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText)
          renderWidget(data)
        } catch (e) {
          wrap.innerHTML = '<div class="zw-state">' + esc(t.error) + '</div>'
        }
      } else {
        wrap.innerHTML = '<div class="zw-state">' + esc(t.error) + '</div>'
      }
    }
    xhr.onerror = function () {
      wrap.innerHTML = '<div class="zw-state">' + esc(t.error) + '</div>'
    }
    xhr.send()
  }

  // Start fetch after brief delay so skeletons render first
  setTimeout(fetchData, 0)
})()
