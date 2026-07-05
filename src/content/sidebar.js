(function registerNeuralPhantomSidebar() {
  if (window.NeuralPhantomSidebar) {
    return;
  }

  const engine = window.NeuralPhantomAssistantEngine;
  const storage = window.NeuralPhantomStorage;
  let root;
  let state = {
    notes: [],
    goals: [],
    activeModule: "learning"
  };
  const ready = storage.loadState().then((savedState) => {
    state = savedState;
  });
  let context = window.NeuralPhantomContext.detect();
  let view = engine.buildAssistantView(context, state.activeModule);
  let lastAnswer = "Select a module or ask a question to get context-aware help.";

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === "className") {
        node.className = value;
      } else if (key === "text") {
        node.textContent = value;
      } else if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        node.setAttribute(key, value);
      }
    });
    children.forEach((child) => node.append(child));
    return node;
  }

  function refreshContext() {
    context = window.NeuralPhantomContext.detect();
    view = engine.buildAssistantView(context, state.activeModule);
  }

  async function setActiveModule(moduleId) {
    state = { ...state, activeModule: moduleId };
    await storage.saveState(state);
    refreshContext();
    render();
  }

  async function submitQuestion(message) {
    const text = message.trim();
    if (!text) {
      return;
    }

    refreshContext();
    const result = await engine.askAssistant({
      context,
      moduleId: state.activeModule,
      message: text
    });
    lastAnswer = result.answer;
    render();
  }

  async function saveNote() {
    const text = lastAnswer.trim();
    if (!text) {
      return;
    }

    state = {
      ...state,
      notes: await storage.addNote({
        text,
        module: state.activeModule,
        url: context.url,
        title: context.title
      })
    };
    render();
  }

  async function saveGoal() {
    const text = context.selection || view.activeModule.suggestions[0] || context.title;
    state = {
      ...state,
      goals: await storage.addGoal({
        text,
        source: context.url
      })
    };
    render();
  }

  async function toggleGoal(goalId) {
    state = {
      ...state,
      goals: await storage.toggleGoal(goalId)
    };
    render();
  }

  function renderGoals() {
    if (!state.goals.length) {
      return el("p", {
        className: "np-list",
        text: "No goals yet. Save one from the current page when something matters."
      });
    }

    return el("div", { className: "np-list" }, state.goals.slice(0, 5).map((goal) => {
      const checkbox = el("input", {
        type: "checkbox",
        ...(goal.completed ? { checked: "checked" } : {}),
        onchange: () => toggleGoal(goal.id)
      });
      return el("label", { className: "np-goal" }, [
        checkbox,
        el("span", { text: goal.text })
      ]);
    }));
  }

  function renderComposer() {
    const input = el("textarea", {
      className: "np-input",
      placeholder: "Ask for help with this page or selected text..."
    });

    return el("footer", { className: "np-composer" }, [
      input,
      el("div", { className: "np-actions" }, [
        el("button", {
          className: "np-button",
          type: "button",
          onclick: () => submitQuestion(input.value)
        }, [document.createTextNode("Ask")]),
        el("button", {
          className: "np-button secondary",
          type: "button",
          onclick: saveNote
        }, [document.createTextNode("Save Note")]),
        el("button", {
          className: "np-button secondary",
          type: "button",
          onclick: saveGoal
        }, [document.createTextNode("Save Goal")])
      ])
    ]);
  }

  function render() {
    refreshContext();

    if (!root) {
      root = el("aside", { id: "neuralphantom-root" });
      document.documentElement.append(root);
    }

    root.textContent = "";
    root.append(el("div", { className: "np-shell" }, [
      el("header", { className: "np-header" }, [
        el("div", { className: "np-title" }, [
          el("strong", { text: "NeuralPhantom Assistant" }),
          el("span", { title: context.url, text: `${context.pageType} - ${context.hostname}` })
        ]),
        el("button", {
          className: "np-icon-button",
          type: "button",
          title: "Close sidebar",
          "aria-label": "Close sidebar",
          onclick: hide
        }, [document.createTextNode("x")])
      ]),
      el("div", { className: "np-body" }, [
        el("nav", { className: "np-tabs", "aria-label": "Assistant modules" },
          view.modules.map((module) => el("button", {
            className: "np-tab",
            type: "button",
            "aria-selected": String(module.id === state.activeModule),
            onclick: () => setActiveModule(module.id)
          }, [document.createTextNode(module.label)]))
        ),
        el("main", { className: "np-main" }, [
          el("div", { className: "np-scroll" }, [
            el("section", { className: "np-section" }, [
              el("h3", { text: "Detected Context" }),
              el("pre", { className: "np-context", text: view.contextSummary })
            ]),
            el("section", { className: "np-section" }, [
              el("h3", { text: "Quick Prompts" }),
              el("div", { className: "np-suggestions" }, view.suggestions.map((suggestion) => el("button", {
                className: "np-chip",
                type: "button",
                onclick: () => submitQuestion(suggestion)
              }, [document.createTextNode(suggestion)])))
            ]),
            el("section", { className: "np-section" }, [
              el("h3", { text: "Assistant" }),
              el("div", { className: "np-answer", text: lastAnswer })
            ]),
            el("section", { className: "np-section" }, [
              el("h3", { text: "Goals" }),
              renderGoals()
            ])
          ]),
          renderComposer()
        ])
      ])
    ]));
  }

  async function show() {
    await ready;
    render();
  }

  function hide() {
    root?.remove();
    root = null;
  }

  async function toggle() {
    if (root) {
      hide();
    } else {
      await show();
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "NEURALPHANTOM_TOGGLE") {
      toggle();
    }
  });

  document.addEventListener("selectionchange", () => {
    if (root) {
      refreshContext();
    }
  });

  window.NeuralPhantomSidebar = { show, hide, toggle };
})();
