(function registerNeuralPhantomContextDetector() {
  if (window.NeuralPhantomContext) {
    return;
  }

  const pageTypeRules = [
    { type: "pull-request", test: /github\.com\/[^/]+\/[^/]+\/pull\/\d+/i },
    { type: "issue", test: /github\.com\/[^/]+\/[^/]+\/issues\/\d+/i },
    { type: "code", test: /(github|gitlab|bitbucket|stackoverflow|stackblitz|codesandbox|localhost|127\.0\.0\.1)/i },
    { type: "job", test: /(linkedin\.com\/jobs|indeed\.com|internshala|greenhouse|lever\.co|jobs|careers)/i },
    { type: "course", test: /(coursera|udemy|edx|datacamp|khanacademy|learn|course)/i },
    { type: "security", test: /(cve|owasp|portswigger|hackerone|bugcrowd|tryhackme|hackthebox|security)/i },
    { type: "email", test: /(mail\.google|outlook\.live|outlook\.office|mail)/i },
    { type: "calendar", test: /(calendar\.google|outlook\.office.*calendar)/i },
    { type: "search", test: /(google\.com\/search|bing\.com\/search|duckduckgo\.com)/i },
    { type: "documentation", test: /(docs|developer|reference|api|manual)/i }
  ];

  function getMeta(name) {
    return document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.content || "";
  }

  function inferPageType(url) {
    const haystack = `${url.href} ${document.title} ${getMeta("description")}`.toLowerCase();
    return pageTypeRules.find((rule) => rule.test.test(haystack))?.type
      || (document.querySelector("article") ? "article" : "webpage");
  }

  function getVisibleHeadings() {
    return [...document.querySelectorAll("h1, h2")]
      .map((heading) => heading.textContent?.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  window.NeuralPhantomContext = {
    detect() {
      const url = new URL(location.href);
      const selection = String(window.getSelection?.() || "").trim();
      const headings = getVisibleHeadings();

      return {
        url: url.href,
        hostname: url.hostname,
        path: url.pathname,
        title: document.title,
        pageType: inferPageType(url),
        selection,
        description: getMeta("description") || getMeta("og:description"),
        mainHeading: headings[0] || "",
        headings,
        detectedAt: new Date().toISOString()
      };
    }
  };
})();
