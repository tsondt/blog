$(function() {
  // ScrollAppear
  if (typeof $.fn.scrollAppear === 'function') {
    $('.appear').scrollAppear();
  }

  // Fluidbox
  $('.fluidbox-trigger').fluidbox();

  // Share buttons
  $('.article-share a').on('click', function() {
    window.open($(this).attr('href'), 'Share', 'width=200,height=200,noopener');
    return false;
  });

  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) {
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const sheetPairs = [
    {
      light: document.querySelector('link[data-theme="light"]'),
      dark: document.querySelector('link[data-theme="dark"]')
    }
  ];

  const syncStylesheets = theme => {
    sheetPairs.forEach(pair => {
      if (pair.light) {
        pair.light.media = theme === 'light' ? 'all' : 'not all';
      }
      if (pair.dark) {
        pair.dark.media = theme === 'dark' ? 'all' : 'not all';
      }
    });
  };

  const applyTheme = theme => {
    document.documentElement.dataset.theme = theme;
    toggle.classList.toggle('is-light', theme === 'light');
    toggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    syncStylesheets(theme);
  };

  const getCurrentTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved;
    }
    return prefersDark.matches ? 'dark' : 'light';
  };

  applyTheme(getCurrentTheme());

  const handleSchemeChange = event => {
    if (localStorage.getItem('theme')) {
      return;
    }
    applyTheme(event.matches ? 'dark' : 'light');
  };

  if (prefersDark.addEventListener) {
    prefersDark.addEventListener('change', handleSchemeChange);
  } else if (prefersDark.addListener) {
    prefersDark.addListener(handleSchemeChange);
  }

  toggle.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
});
