# Networked performance with quantised latency
Mikey Lemmon | Minor Assignment 2 | CMPO 385

The app is live at [doomboom.tv](https://doomboom.tv)

## Running locally

To run the app, target your favorite static server at the "docs" directory. E.g. using the [serve](https://www.npmjs.com/package/serve) command:

	$ serve -s docs
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

## A rough guide to the source code

-   **README.md** — a link to this file
-   **docs/** — a "production build" of the app
-   **server-go/** — source code for the server
	- **thump/** - code for the main executable; can be built with `go build .` if go is installed on your system
	- **api/** - type definitions for the websocket API. Complements **client-web/src/components/serverApi/**.
-   **client-web/** — source code for the app, initialized with create-react-app
	- **README.md** — this file
	- **public/** — static files that get packaged into the root directory of the build
		- **samples/808/** — audio files for the "eightOhEight" instrument
	- **src/** — the meat of the app
		- **index.tsx** — the entry-point for the application
		- **app/**
			- **App.tsx** — the app's root UI component. Renders VideoOutput
			- **VideoOutput.tsx** — wraps Sketch in a React component
			- **Sketch.ts** — contains the Sketch class, which defines a p5 sketch and coordinates MIDI inputs, Tone instruments, and websocket communication
			- **MIDI.ts** - contains type definitions for MIDI events, and defines the MIDI class, which forwards events to the provided handler (Sketch)
			- **instruments.ts** - defines two simple Tone instruments: piano, and eightOhEight
			- **VisualNotes.ts** - manages p5 shapes that drawn for each note
			- **serverApi/** - defines types and helper functions for communication with the server
				- **WSClient.ts** - manages the websocket connection, parsing received messages and forwarding events to registered handlers
				- **WSClock.ts** - implements an NTPD-ish clock syncing algorithm, computing first- and second-derivative offsets for the local clock to align it with the server's 'global' clock
				- **serverApi.ts** - defines core types, variables, and helper functions used in the websocket API. Also contains the declaration of the websocket server's URL
				- **serverClock.ts** - clock-specific types, variables, and helper functions for the websocket API

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
