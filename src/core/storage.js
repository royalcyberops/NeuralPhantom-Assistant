(function registerNeuralPhantomStorage() {
  if (window.NeuralPhantomStorage) {
    return;
  }

  const defaultState = {
    notes: [],
    goals: [],
    activeModule: "learning"
  };

  async function loadState() {
    const data = await chrome.storage.local.get(defaultState);
    return { ...defaultState, ...data };
  }

  async function saveState(nextState) {
    await chrome.storage.local.set(nextState);
  }

  async function addNote(note) {
    const state = await loadState();
    const notes = [
      {
        id: crypto.randomUUID(),
        text: note.text.trim(),
        module: note.module,
        url: note.url,
        title: note.title,
        createdAt: new Date().toISOString()
      },
      ...state.notes
    ].slice(0, 50);

    await saveState({ ...state, notes });
    return notes;
  }

  async function addGoal(goal) {
    const state = await loadState();
    const goals = [
      {
        id: crypto.randomUUID(),
        text: goal.text.trim(),
        source: goal.source,
        completed: false,
        createdAt: new Date().toISOString()
      },
      ...state.goals
    ].slice(0, 25);

    await saveState({ ...state, goals });
    return goals;
  }

  async function toggleGoal(goalId) {
    const state = await loadState();
    const goals = state.goals.map((goal) => (
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    ));
    await saveState({ ...state, goals });
    return goals;
  }

  window.NeuralPhantomStorage = {
    loadState,
    saveState,
    addNote,
    addGoal,
    toggleGoal
  };
})();
