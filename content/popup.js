
var state = {
  compiler: {},
  themes: [],
  theme: '',
  raw: false
}

var events = {
  changeCompiler: (e) => {
    state.compiler[e.target.name] = !state.compiler[e.target.name]
    chrome.runtime.sendMessage({
      message: 'compiler',
      compiler: state.compiler
    })
  },

  changeTheme: (e) => {
    state.theme = state.themes[e.target.selectedIndex]
    chrome.runtime.sendMessage({
      message: 'theme',
      theme: state.theme
    })
  },

  viewRaw: () => {
    state.raw = !state.raw
    chrome.runtime.sendMessage({
      message: 'raw',
      raw: state.raw,
      theme: state.theme
    })
  },

  setDefaults: () => {
    chrome.runtime.sendMessage({
      message: 'defaults'
    }, (res) => {
      chrome.runtime.sendMessage({message: 'settings'}, init)
    })
  },

  advancedOptions: () => {
    chrome.runtime.sendMessage({message: 'advanced'})
  }
}

var description = {
  gfm: 'Enable GFM\n(GitHub Flavored Markdown)',
  tables: 'Enable GFM tables\n(requires the gfm option to be true)',
  breaks: 'Enable GFM line breaks\n(requires the gfm option to be true)',
  pedantic: 'Don\'t fix any of the original markdown\nbugs or poor behavior',
  sanitize: 'Ignore any HTML\nthat has been input',
  smartLists: 'Use smarter list behavior\nthan the original markdown',
  smartypants: 'Use "smart" typograhic punctuation\nfor things like quotes and dashes'
}

function init (res) {
  state.compiler = res.compiler
  state.theme = res.theme

  state.themes = chrome.runtime.getManifest().web_accessible_resources
    .filter((file) => (file.indexOf('/themes/') === 0))
    .map((file) => (file.replace(/\/themes\/(.*)\.css/, '$1')))

  state.raw = res.raw
  m.redraw()
}

function oncreate (vnode) {
  componentHandler.upgradeElements(vnode.dom)
}
var onupdate = (key) => (vnode) => {
  if (vnode.dom.classList.contains('is-checked') !== state.compiler[key]) {
    vnode.dom.classList.toggle('is-checked')
  }
}

chrome.runtime.sendMessage({message: 'settings'}, init)

m.mount(document.querySelector('body'), {
  view: (vnode) =>
    m('#popup', [
      m('button.mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect',
        {oncreate, onclick: events.viewRaw},
        (state.raw ? 'Html' : 'Markdown')),
      m('button.mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect',
        {oncreate, onclick: events.setDefaults},
        'Defaults'),

      m('.mdl-tabs mdl-js-tabs mdl-js-ripple-effect', {oncreate},
        m('.mdl-tabs__tab-bar',
          m('a.mdl-tabs__tab', {href: '#tab-theme', class: 'is-active'}, 'Theme')
        ),
        m('.mdl-tabs__panel #tab-theme', {class: 'is-active'},
          m('select.mdl-shadow--2dp', {onchange: events.changeTheme}, state.themes.map((theme) =>
            m('option', {selected: state.theme === theme}, theme)
          ))
        )
      ),

      m('.mdl-tabs mdl-js-tabs mdl-js-ripple-effect', {oncreate},
        m('.mdl-tabs__tab-bar',
          m('a.mdl-tabs__tab', {href: '#tab-compiler', class: 'is-active'}, 'Compiler'),
          m('a.mdl-tabs__tab', {href: '#tab-content'}, 'Content')
        ),
        m('.mdl-tabs__panel #tab-compiler', {class: 'is-active'},
          m('.mdl-grid', Object.keys(state.compiler).map((key) =>
            m('.mdl-cell',
              m('label.mdl-switch mdl-js-switch mdl-js-ripple-effect',
                {oncreate, onupdate: onupdate(key), title: description[key]}, [
                m('input[type="checkbox"].mdl-switch__input', {
                  name: key,
                  checked: state.compiler[key],
                  onchange: events.changeCompiler
                }),
                m('span.mdl-switch__label', key)
              ])
            )
          ))
        ),
        m('.mdl-tabs__panel #tab-content',
          m('.mdl-grid',
            m('.mdl-cell', 'Content')
          )
        )
      ),

      m('button.mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect',
        {oncreate, onclick: events.advancedOptions},
        'Advanced Options')
    ])
})
