(() => {
  const api = globalThis.browser || globalThis.chrome;

  const originalTexts = new WeakMap();
  const translatedTexts = new WeakMap();

  let enabled = true;
  let observer = null;

  const excluded = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "CODE",
    "PRE",
    "OPTION",
    "SELECT"
  ]);

  function shouldSkip(node) {
    const parent = node.parentElement;

    if (!parent) return true;

    if (excluded.has(parent.tagName)) return true;

    if (parent.isContentEditable) return true;

    if (parent.closest("[contenteditable='true']")) {
      return true;
    }

    if (parent.closest("[translate='no']")) {
      return true;
    }

    return false;
  }

  function translateNode(node) {
    if (!enabled || !node.isConnected) return;
    if (shouldSkip(node)) return;

    const current = node.nodeValue;

    if (!current || current.trim().length < 10) {
      return;
    }

    const lastTranslation = translatedTexts.get(node);

    // Ikke oversett vår egen oversettelse på nytt.
    if (lastTranslation === current) return;

    // Hvis nettsiden har endret teksten, behandler vi
    // den nye teksten som original.
    const translated =
      globalThis.NynorskTranslator.translate(current);

    if (translated !== current) {
      originalTexts.set(node, current);
      translatedTexts.set(node, translated);
      node.nodeValue = translated;
    } else {
      originalTexts.delete(node);
      translatedTexts.delete(node);
    }
  }

  function processElement(element) {
    if (!element || !enabled) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT
    );

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach(translateNode);
  }

  function restoreAll() {
    if (observer) observer.disconnect();

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    for (const node of nodes) {
      const original = originalTexts.get(node);
      const translated = translatedTexts.get(node);

      if (
        original !== undefined &&
        node.nodeValue === translated
      ) {
        node.nodeValue = original;
      }

      originalTexts.delete(node);
      translatedTexts.delete(node);
    }
  }

  function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(mutations => {
      if (!enabled) return;

      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateNode(mutation.target);
        }

        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            translateNode(node);
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            processElement(node);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  async function initialize() {
    try {
      await globalThis.NynorskTranslator.ready;

      const settings = await api.storage.local.get({
        enabled: true
      });

      enabled = settings.enabled;

      if (enabled) {
        processElement(document.body);
        startObserver();
      }
    } catch (error) {
      console.error("Kunne ikke starte oversettelsen:", error);
    }
  }

  api.storage.onChanged.addListener(
    (changes, area) => {
      if (area !== "local") return;
      if (!changes.enabled) return;

      enabled = changes.enabled.newValue;

      if (enabled) {
        processElement(document.body);
        startObserver();
      } else {
        restoreAll();
      }
    }
  );

  initialize();
})();
