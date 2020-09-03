# Thump | An in-browser D[A/V]W
Mikey Lemmon | Minor Assignment 1 | CMPO 385

## Instructions

To run the app, target your favorite static server at the "minor-assignment-1" directory. E.g. using the [serve](https://www.npmjs.com/package/serve) command:

	$ serve -s minor-assignment-1
	┌───────────────────────────────────────────────────┐
	│                                                   │
	│   Serving!                                        │
	│                                                   │
	│   - Local:            http://localhost:5000       │
	│   - On Your Network:  http://192.168.0.174:5000   │
	│                                                   │
	│   Copied local address to clipboard!              │
	│                                                   │
	└───────────────────────────────────────────────────┘

> NOTE: The "Docs" link at the bottom-right of the app may or may not work depending on the configuration of your static server. If the link is opening a blank page or showing the sequencer view, you can point your static server to the docs folder directly to be able to view the docs (e.g. `$ serve -s minor-assignment-1/docs`)

Open the root address for the server (http://localhost:5000 in the example above) and you should see some sequencer grids and a "PLAY" button at the bottom of the screen. Press "PLAY" and you should hear the sequencer patterns playing.

In the bottom right of the screen, just above the "PLAY" bar, you should see a "Visualizer" block in the "Instruments" section — hold <Shift> and click the link that says "shift+click to open" to open a new page for the video generator that is connected to the sequencers. Click "PLAY" in the new window and you should see some kaleidoscopic shapes start matching the music. Alter the sequencer patterns in the first tab and you should be able to see and hear the results of your changes.

> NOTE: Due to some specifics of browser audio permissions and the way Tone.js works, for the video view to activate you have to press "PLAY" at least once in the video view (rather than the sequencer view). After that, PLAY/STOP can be triggered from any open tab/window.

## Core technologies

-   [TypeScript](https://www.typescriptlang.org/): TypeScript is a strongly-typed superset of JavaScript, and is used in the app to make the assumptions of the app's internal APIs more explicit and declarative. VS Code has support for TypeScript builtin, so autocompletion tips include type annotations automatically.
	- Still TODO: The app's source code is not yet taking advantage of TypeScript/VSCode's support for the JSDoc comment format, converting to JSDoc style for comments would improve IDE integration further (code commenting in general could definitely be improved).
-   [React](https://reactjs.org/): A popular JavaScript UI framework
	- [create-react-app](https://create-react-app.dev/): This project was initialized with create-react-app to provide the base developer tooling environment (development build server, production builds, etc)
-   [Redux](https://redux.js.org/): A popular "state container". Redux is used in the app to manage the app state, including playing/stopped, the sequencers and their patters, the instruments (both audio and video), and the connections between the two. [Redux Toolkit](https://redux-toolkit.js.org/) is used to reduce boilerplate code and implement common redux patterns.
	- [redux-observable](https://redux-observable.js.org/) and [rxjs](https://rxjs-dev.firebaseapp.com/) ([ReactiveX](http://reactivex.io/)): redux-observable is used in the app to construct reactive pipelines ("epics") that respond to changes in state (e.g. sending start/stop commands to Tone via the apps "engine" API)
	- [SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker): App state is divided into "shared" and "local" state, with local being data specific to the current tab, and "shared" being synced across all open tabs/windows. A SharedWorker manages the shared state, relaying actions to all open tabs when changes occur.
		- [react-redux](https://react-redux.js.org/): React bindings for Redux, enabling React components to easily get state from the Redux store.
-   [Tone.js](https://tonejs.github.io/): Tone.js is used to enable high-precision event triggering based on sequencer patterns, and is also used to implement the audio instruments.
	- [p5.js](https://p5js.org/): p5 backs the video instrument engine.

## A rough guide to the source code

-   **README.md** — a link to this file
-   **minor-assignment-1/** — a "production build" of the app
-   **client-web/** — source code for the app, initialized with create-react-app
	- **README.md** — this file
	- **public/** — static files that get packaged into the root directory of the build
		- **docs/** — auto-generated documentation for the app's code. Not super-useful currently (partly due to a dearth of JSDoc code comments), VS Code's built-in TypeScript support seems to be a better way to get the same level of information.
		- **samples/tappy/** — audio files for the "Tappy" instrument
	- **src/** — the meat of the app
		- **index.tsx** — the entry-point for the application, binds the redux store and path routing to the app
		- **app/**
			- **App.tsx** — the app's root UI component, renders either the sequencers or the video output depending on the URL path
			- **loadPresets.ts** — exports a function that loads a preset scene into the app
		- **components/** — the React components that comprise the UI
		- **engine/** — The app's "engine" instantiates the app's state, managing the transport, sequencers, and instruments. The engine is "local" to the current tab/window
			- **Engine.ts** — defines and exports the root-level engine, which provides an API that state observers (see "stateLocal/" below) use to keep the engine up-to-date with state changes. The engine will skip instantiation of audio instruments if it is informed that this client is not an audio player, ensuring that only one tab/window outputs audio
			- **EngineInstrument.ts** — defines the engine's instrument API
			- **EngineSequence.ts** — defines and implements the engine's sequence API (unlike instruments, there is currently only one type of sequence). An EngineSequence manages a Tone.Sequence, updating the sequence events when state changes (e.g. when a user toggles a trigger in the sequence pattern)
			- **audio/** — implementations of EngineInstrument that convert triggers into sound. Currently only two instruments are implemented: "Haunted", a fat synth that's maybe a bit too Stranger Things; and "Tappy", a weird sample-based drum machine
			- **video/** — implementations of EngineInstrument that define a p5 sketch and convert triggers into visuals. Currently there is only one video instrument, "Puddleish"
				- Still TODO: formalize the p5 sketch API into an EngineInstrumentVideo interface so that the VideoOutput component doesn't need to hardcode a typecast to Puddlish
			- **old-instruments/** — instruments that were created during testing but are not currently being used
		- **storeLocal/** — the Redux state store that backs the app
			- **storeLocal.ts** — instantiates and exports the local store. Internally, it connects to the "storeWorker" (a SharedWorker that manages the shared state store) and proxies actions to the worker
			- **rootReducerLocal.ts** — defines the top-level reducer and state types
			- **rootEpicLocal.ts** — defines rxjs observable pipelines that watch state changes and update the **engine** when important changes occur (e.g. a sequence pattern was updated, play/pause, etc)
			- **api[Type].ts** — "api" files provide high-level APIs for accessing and updating state. Memoized ["selectors"](https://github.com/reduxjs/reselect) are defined in api files to provide UI components and other state consumers performant access to derived state (selectors have a tiered approach to caching data that enables them to avoid recomputing derived data if the source state hasn't changed)
			- **slice[Type].ts** — "slice" files define reducers and actions that manage a subset ("slice") of app state
		- **storeShared/** — a root reducer and slices for the shared state, used by both storeLocal and storeWorker
			- **apiWorker.ts** — defines the storeWorker API, used by storeLocal and storeWorker for sending and receiving messages
			- **reducerShared.ts** — reducer and state types for the shared state
			- **slice[Type].ts** — reducers and actions that manage a subset ("slice") of shared state
		- **storeWorker/** — the shared state worker, runs as a SharedWorker
			- **worker.ts** — entry-point for the worker, instantiates the shared store and defines connection and message handlers for communicating with clients
			- **rootEpicWorker.ts** — defines an rxjs observable pipeline that fans-out action events to all the clients

## Developer tooling

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
