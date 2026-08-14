(function () {
  function sync(selectId) {
    const native = document.querySelector(`#${selectId}`);
    const wrapper = document.querySelector(`[data-filter-select="${selectId}"]`);
    if (!native || !wrapper) return;

    const trigger = wrapper.querySelector('.filter-select-trigger');
    const label = trigger.querySelector('span');
    const menu = wrapper.querySelector('.filter-select-menu');
    const selected = native.options[native.selectedIndex];

    label.textContent = selected?.textContent || '';
    label.classList.toggle('is-placeholder', native.value === 'all');
    menu.innerHTML = Array.from(native.options).map(option => `
      <button type="button" class="filter-select-option${option.value === native.value ? ' is-selected' : ''}"
        role="option" aria-selected="${option.value === native.value}" data-filter-value="${option.value}">
        ${option.textContent}
      </button>
    `).join('');
    trigger.setAttribute('aria-expanded', String(wrapper.classList.contains('is-open')));
  }

  function closeAll(except) {
    document.querySelectorAll('.filter-select.is-open').forEach(wrapper => {
      if (wrapper !== except) {
        wrapper.classList.remove('is-open');
        sync(wrapper.dataset.filterSelect);
      }
    });
  }

  function init(wrapper) {
    const selectId = wrapper.dataset.filterSelect;
    const native = wrapper.querySelector('.filter-select-native');
    const trigger = wrapper.querySelector('.filter-select-trigger');
    const menu = wrapper.querySelector('.filter-select-menu');
    if (!selectId || !native || !trigger || !menu || wrapper.dataset.selectReady) return;

    wrapper.dataset.selectReady = 'true';
    sync(selectId);
    trigger.addEventListener('click', event => {
      event.stopPropagation();
      const willOpen = !wrapper.classList.contains('is-open');
      closeAll(wrapper);
      wrapper.classList.toggle('is-open', willOpen);
      sync(selectId);
    });
    menu.addEventListener('click', event => {
      const option = event.target.closest('[data-filter-value]');
      if (!option) return;
      native.value = option.dataset.filterValue;
      wrapper.classList.remove('is-open');
      native.dispatchEvent(new Event('change', { bubbles: true }));
    });
    native.addEventListener('change', () => sync(selectId));
  }

  window.CNAPSelect = {
    initAll() {
      document.querySelectorAll('[data-filter-select]').forEach(init);
    },
    sync,
    closeAll
  };
})();
