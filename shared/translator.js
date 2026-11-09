(() => {
  const api = globalThis.browser || globalThis.chrome;

  let dictionary = {};

  async function loadDictionary() {
    try {
      const url = api.runtime.getURL("dictionary.json");

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Kunne ikke hente dictionary.json");
      }

      const data = await response.json();

      dictionary = data.words || {};

      console.log(
        `Nynorsk til Bokmål: Lastet ${Object.keys(dictionary).length} ord.`
      );

    } catch (error) {
      console.error("Feil ved innlasting av ordlisten:", error);
      dictionary = {};
    }
  }

  function detect(text) {
    const markers = [
      "ikkje", "kva", "kvifor", "korleis",
      "kvar", "kven", "sjølv", "berre",
      "framleis", "allereie", "nokon",
      "noko", "me", "dykk", "òg",
      "utan", "frå", "gjekk", "fekk",
      "vert", "vart", "finst", "skule",
      "mogleg", "vanskeleg", "medan"
    ];

    const words = text.toLowerCase().match(
      /[\p{L}]+/gu
    ) || [];

    if (words.length < 3) return false;

    return words.some(word => markers.includes(word));
  }

  function preserveCase(original, replacement) {
    if (original === original.toUpperCase()) {
      return replacement.toUpperCase();
    }

    if (
      original[0] === original[0].toUpperCase()
    ) {
      return replacement[0].toUpperCase() +
        replacement.slice(1);
    }

    return replacement;
  }

  function translate(text) {
    if (!text || !detect(text)) return text;

    let result = text;

    const entries = Object.entries(dictionary)
      .sort((a, b) => b[0].length - a[0].length);

    for (const [from, to] of entries) {
      const escaped = from.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(
        `(?<![\\p{L}])${escaped}(?![\\p{L}])`,
        "giu"
      );

      result = result.replace(regex, match =>
        preserveCase(match, to)
      );
    }

    return result;
  }

  const ready = loadDictionary();

  globalThis.NynorskTranslator = {
    ready,
    detect,
    translate
  };
})();
