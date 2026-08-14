(function () {
  function init(input) {
    if (!input || input.dataset.cnapInputReady || input.type === 'checkbox') return;
    input.dataset.cnapInputReady = 'true';
    input.classList.add('cnap-input');
    const size = input.dataset.cnapInputSize || 'medium';
    input.classList.add(`cnap-input--${size}`);
  }

  window.CNAPInput = {
    initAll(root = document) {
      root.querySelectorAll(
        '#runtimePage .runtime-setting-row input:not([type="checkbox"]), ' +
        '#runtimePage .runtime-setting-row textarea, ' +
        '#runtimePage .runtime-image-list input:not([type="checkbox"]), ' +
        '#runtimePage .runtime-image-list textarea'
      ).forEach(init);
    },
    init
  };
})();
