(function registerNeuralPhantomAssistantEngine() {
  if (window.NeuralPhantomAssistantEngine) {
    return;
  }

  const modules = window.NeuralPhantomModules;

  function compactText(value, limit = 450) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
  }

  function getContextSummary(context) {
    const parts = [
      `Page: ${context.title || "Untitled"}`,
      `Type: ${context.pageType}`,
      `Site: ${context.hostname || "unknown"}`
    ];

    if (context.selection) {
      parts.push(`Selection: ${compactText(context.selection, 220)}`);
    } else if (context.description) {
      parts.push(`Description: ${compactText(context.description, 220)}`);
    }

    return parts.join("\n");
  }

  function createResponse(module, context, message) {
    const selection = context.selection ? compactText(context.selection, 280) : "";
    const intent = compactText(message, 140);
    const focus = selection || compactText(context.description || context.mainHeading || context.title, 280);
    const opening = `I am reading this as a ${context.pageType} page on ${context.hostname || "this site"}.`;
    const actionLine = intent ? `For "${intent}", here is a practical path:` : module.prompt;
    const steps = [
      `Focus: ${focus || "Use the visible page context as the starting point."}`,
      "Next: clarify the outcome you want, then split it into one small action you can finish now.",
      "Check: capture one note or goal so this context turns into progress instead of another open tab."
    ];

    if (module.id === "development") {
      steps[1] = "Next: reproduce the behavior, inspect inputs and outputs, then add one focused test before changing code.";
    }

    if (module.id === "cybersecurity") {
      steps[1] = "Next: keep the analysis defensive: identify assets, trust boundaries, likely misuse cases, and safe mitigations.";
    }

    if (module.id === "career") {
      steps[1] = "Next: extract the key skills, compare them with your current proof, and draft one specific improvement action.";
    }

    return `${opening}\n\n${actionLine}\n\n${steps.map((step) => `- ${step}`).join("\n")}`;
  }

  function buildAssistantView(context, activeModuleId) {
    const rankedModules = modules.rankModules(context);
    const activeModule = modules.getModuleById(activeModuleId || rankedModules[0]?.id);

    return {
      activeModule,
      modules: rankedModules,
      contextSummary: getContextSummary(context),
      suggestions: activeModule.suggestions
    };
  }

  async function askAssistant({ context, moduleId, message }) {
    const module = modules.getModuleById(moduleId);
    return {
      answer: createResponse(module, context, message),
      generatedAt: new Date().toISOString()
    };
  }

  window.NeuralPhantomAssistantEngine = {
    buildAssistantView,
    askAssistant
  };
})();
