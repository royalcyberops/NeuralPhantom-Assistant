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
  let isThinking = false;
  let messages = [
    {
      role: "assistant",
      text: "Hey, I am NeuralPhantom. Pick a mode, select text on the page, or ask me what to do next.",
      meta: "Ready"
    }
  ];

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
    messages = [
      ...messages,
      {
        role: "assistant",
        text: `Switched to ${view.activeModule.label}. I will shape answers around this page and that goal.`,
        meta: "Mode changed"
      }
    ].slice(-12);
    render();
  }

  async function submitQuestion(message) {
    const text = message.trim();
    if (!text) {
      return;
    }

    refreshContext();
    messages = [
      ...messages,
      { role: "user", text, meta: "You" }
    ].slice(-12);
    isThinking = true;
    render();

    const result = await engine.askAssistant({
      context,
      moduleId: state.activeModule,
      message: text
    });
    messages = [
      ...messages,
      { role: "assistant", text: result.answer, meta: view.activeModule.label }
    ].slice(-12);
    isThinking = false;
    render();
  }

  async function saveNote() {
    const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");
    const text = lastAssistantMessage?.text.trim() || "";
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
    messages = [
      ...messages,
      { role: "assistant", text: "Saved that as a note for this page.", meta: "Saved" }
    ].slice(-12);
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
    messages = [
      ...messages,
      { role: "assistant", text: "Goal captured. Small progress still counts when it is tracked.", meta: "Goal saved" }
    ].slice(-12);
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
      return el("div", {
        className: "np-empty",
        text: "No goals yet. Save one from the current page when something matters."
      });
    }

    return el("div", { className: "np-goals" }, state.goals.slice(0, 4).map((goal) => {
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

  function renderMessages() {
    const renderedMessages = messages.map((message) => el("div", {
      className: `np-message ${message.role === "user" ? "from-user" : "from-assistant"}`
    }, [
      el("div", { className: "np-message-meta", text: message.meta || (message.role === "user" ? "You" : "NeuralPhantom") }),
      el("div", { className: "np-bubble", text: message.text })
    ]));

    if (isThinking) {
      renderedMessages.push(el("div", { className: "np-message from-assistant" }, [
        el("div", { className: "np-message-meta", text: "NeuralPhantom" }),
        el("div", { className: "np-bubble typing" }, [
          el("span"),
          el("span"),
          el("span")
        ])
      ]));
    }

    return renderedMessages;
  }

  function renderComposer() {
    const input = el("textarea", {
      className: "np-input",
      placeholder: "Ask for help with this page or selected text..."
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitQuestion(input.value);
      }
    });

    return el("footer", { className: "np-composer" }, [
      input,
      el("div", { className: "np-actions" }, [
        el("button", {
          className: "np-button primary",
          type: "button",
          onclick: () => submitQuestion(input.value)
        }, [document.createTextNode("Send")]),
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
        el("div", { className: "np-orb", text: "N" }),
        el("div", { className: "np-title" }, [
          el("strong", { text: "NeuralPhantom Assistant" }),
          el("span", { title: context.url, text: `${view.activeModule.label} on ${context.hostname}` })
        ]),
        el("span", { className: "np-premium", text: "Premium" }),
        el("button", {
          className: "np-icon-button",
          type: "button",
          title: "Close sidebar",
          "aria-label": "Close sidebar",
          onclick: hide
        }, [document.createTextNode("x")])
      ]),
      el("main", { className: "np-main" }, [
        el("section", { className: "np-context-card" }, [
          el("div", { className: "np-context-top" }, [
            el("span", { className: "np-context-label", text: context.pageType }),
            el("span", { className: "np-context-site", text: context.hostname || "current page" })
          ]),
          el("p", { text: context.selection ? `Selected: ${context.selection.slice(0, 150)}` : context.title || "Listening to this page" })
        ]),
        el("nav", { className: "np-tabs", "aria-label": "Assistant modules" },
          view.modules.map((module) => el("button", {
            className: "np-tab",
            type: "button",
            "aria-selected": String(module.id === state.activeModule),
            onclick: () => setActiveModule(module.id)
          }, [document.createTextNode(module.label)]))
        ),
        el("section", { className: "np-suggestions" }, view.suggestions.map((suggestion) => el("button", {
          className: "np-chip",
          type: "button",
          onclick: () => submitQuestion(suggestion)
        }, [document.createTextNode(suggestion)]))),
        el("section", { className: "np-chat", "aria-label": "Conversation" }, renderMessages()),
        el("section", { className: "np-goal-dock" }, [
          el("div", { className: "np-dock-title", text: "Goal Tracker" }),
          renderGoals()
        ]),
        renderComposer()
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
