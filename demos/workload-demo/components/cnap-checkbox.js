(function () {
  function sync(wrapper) {
    const input = wrapper?.querySelector('input[type="checkbox"]');
    if (!input) return;
    wrapper.classList.toggle('is-disabled', input.disabled);
    wrapper.dataset.checkboxState = input.indeterminate ? 'mixed' : input.checked ? 'checked' : 'unchecked';
    input.setAttribute('aria-checked', input.indeterminate ? 'mixed' : String(input.checked));
  }

  function init(wrapper) {
    const input = wrapper?.querySelector('input[type="checkbox"]');
    if (!input || wrapper.dataset.cnapCheckboxReady) return;
    wrapper.dataset.cnapCheckboxReady = 'true';
    wrapper.classList.add('cnap-checkbox');
    if (!wrapper.querySelector('.cnap-checkbox-box')) {
      const box = document.createElement('span');
      box.className = 'cnap-checkbox-box';
      box.setAttribute('aria-hidden', 'true');
      input.after(box);
    }
    input.addEventListener('change', () => sync(wrapper));
    sync(wrapper);
  }

  window.CNAPCheckbox = {
    initAll(root = document) {
      root.querySelectorAll('[data-cnap-checkbox]').forEach(init);
    },
    init,
    sync
  };

  window.CNAPCheckbox.initAll();
})();
