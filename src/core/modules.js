(function registerNeuralPhantomModules() {
  if (window.NeuralPhantomModules) {
    return;
  }

  const modules = [
    {
      id: "learning",
      label: "Learning",
      prompt: "Break this down into a clear study path.",
      pageTypes: ["article", "documentation", "course", "search"],
      suggestions: ["Summarize the main idea", "Create a 20-minute study plan", "Explain unfamiliar terms", "Turn this into quiz questions"]
    },
    {
      id: "productivity",
      label: "Productivity",
      prompt: "Turn this context into focused next actions.",
      pageTypes: ["email", "calendar", "document", "dashboard"],
      suggestions: ["Extract action items", "Draft a concise reply", "Prioritize what matters", "Create a follow-up checklist"]
    },
    {
      id: "development",
      label: "Software Dev",
      prompt: "Help reason about this technical context.",
      pageTypes: ["code", "documentation", "issue", "pull-request"],
      suggestions: ["Explain this code or error", "Suggest a debugging path", "Draft tests to add", "Identify edge cases"]
    },
    {
      id: "cybersecurity",
      label: "Cybersecurity",
      prompt: "Analyze this safely for defensive learning.",
      pageTypes: ["security", "code", "documentation", "article"],
      suggestions: ["Map defensive takeaways", "Explain the risk safely", "Create a training checklist", "Suggest secure coding checks"]
    },
    {
      id: "career",
      label: "Career",
      prompt: "Help turn this into career progress.",
      pageTypes: ["job", "profile", "company", "article"],
      suggestions: ["Match skills to this role", "Draft outreach notes", "Find resume keywords", "Plan interview prep"]
    },
    {
      id: "goals",
      label: "Goals",
      prompt: "Connect this context to personal goals.",
      pageTypes: ["dashboard", "document", "article", "course"],
      suggestions: ["Create a goal from this", "Define the next milestone", "Track a small win", "Review blockers"]
    }
  ];

  function getModuleById(id) {
    return modules.find((module) => module.id === id) ?? modules[0];
  }

  function rankModules(context) {
    return modules
      .map((module) => ({
        ...module,
        score: module.pageTypes.includes(context.pageType) ? 2 : 0
      }))
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  }

  window.NeuralPhantomModules = {
    all: modules,
    getModuleById,
    rankModules
  };
})();
