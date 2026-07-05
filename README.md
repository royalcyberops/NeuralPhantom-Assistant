# NeuralPhantom Assistant

NeuralPhantom Assistant is a Chrome Manifest V3 extension that adds a persistent AI-style sidebar across websites. It detects the current browsing context, selected text, and page type, then offers focused assistance for learning, productivity, software development, cybersecurity training, career growth, and personal goal tracking.

## Current Features

- Persistent in-page sidebar on all supported websites
- Toolbar button and `Alt+Shift+N` toggle
- Premium chatbot-style interface with message bubbles, quick prompts, mode pills, and typing feedback
- Website, URL, title, selection, metadata, heading, and page-type detection
- Modular assistant domains for learning, productivity, software development, cybersecurity training, career growth, and goals
- Local notes and goal tracking through Chrome storage
- Offline rule-based responses with a clear adapter point for future AI providers

## Load In Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Turn on Developer mode.
3. Choose "Load unpacked".
4. Select this repository folder.
5. Click the NeuralPhantom toolbar icon or press `Alt+Shift+N`.

## Project Structure

```text
assets/                  Extension icons
src/background.js        Service worker and extension command handling
src/content/             Injected sidebar and page context detection
src/core/                Assistant engine, modules, storage, and utilities
```

## Roadmap

- Add configurable AI provider support
- Add richer page adapters for docs, code hosts, learning platforms, and job boards
- Add export/import for goals and notes
- Add privacy controls per domain
- Add optional cloud sync
