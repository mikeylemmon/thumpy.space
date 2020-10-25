# A Latency-Native Virtual Space For Networked Audio/Visual Performance Over The Internet
Mikey Lemmon | Major Assignment | CMPO 385

This repository implements a browser-based application for collaborative networked performance over the Internet, as described in the [write-up](./write-up.pdf). A running version of the application is live at [mikeylemmon.github.io](https://mikeylemmon.github.io/).

## A rough guide to the source code

-   README.md — a link to this file
-   docs/ — a production build of the app
-   server-go/ — source code for the WebSocket server
	- thump/ - code for the main executable; can be built with `go build .` if go is installed on your system
	- api/ - type definitions for the websocket API. Complements client-web/src/components/serverApi/.
-   client-web/ — source code for the app, initialized with create-react-app
	- README.md — this file
	- public/ — static files that get packaged into the root directory of the build
		- samples/808/ — audio files for the 'eightOhEight' instrument
		- shaders/blackHole.frag - a custom shader for the 'blackHole' instrument that renders the backbuffer with scale and rotation applied
	- src/ — the meat of the app
		- index.tsx — the entry-point for the application
		- app/
			- App.tsx — the app's root UI component. Renders VideoOutput
			- VideoOutput.tsx — wraps Sketch in a React component
			- Sketch.ts — contains the Sketch class, which defines a p5 sketch and coordinates MIDI inputs, Tone instruments, user avatars, and websocket communication
			- SketchInputs.ts - creates and handles DOM elements for user settings
			- SketchAudioKeys.ts - uses the [AudioKeys](https://github.com/kylestetz/AudioKeys) library to generate note events from keyboard input
			- MIDI.ts - contains type definitions for MIDI events, and defines the MIDI class, which forwards events to the provided handler (Sketch)
			- VisualNotes.ts - manages p5 shapes that are drawn for each note
			- Instrument.ts - defines the Instrument class / API
			- instruments/ - implements various instruments and helper classes derived from Instrument
			- InstControls.ts - defines slider UI components that map controlchange events to instrument parameters
			- Loops.ts, Loop.ts - implement the loop and metronome UIs, and send looped events to the server
			- serverApi/ - defines types and helper functions for communication with the server
				- WSClient.ts - manages the websocket connection, parsing received messages and forwarding events to registered handlers
				- WSClock.ts - implements an NTPD-ish clock syncing algorithm, computing first- and second-derivative offsets for the local clock to align it with the server's 'global' clock
				- serverApi.ts - defines core types, variables, and helper functions used in the websocket API. Also contains the declaration of the websocket server's URL
				- serverClock.ts - clock-specific types, variables, and helper functions for the websocket API
		- engine3d/ - implements a simple, component-based 3D engine
			- core/ - contains core type definitions for the engine
				- engine3d.ts - defines and instantiates a root-level manager for the engine, which `update`s and `draw`s all Objs that have been added to the engine
				- Obj.ts - the class `Obj` represents an object in 3D space, with hooks for calling provided p5 draw functions with object transformations already applied. Contains a list of Components, whose `update` functions are called automatically and are used to update object values
				- Component.ts - a simple base class that implements the component api
			- components/ - component implementations
				- FollowCam.ts - when attached to an Obj, continually updates the provided EasyCam (a customized version of [p5.easycam.js](https://diwi.github.io/p5.EasyCam/)) to follow the Obj
				- Physical.ts - gives an Obj velocity, which responds to forces (including hard-coded gravity); collides the Obj with world bounds
			- objs/
				- Avatar.ts — defines the user avatar, handling movement based on arrow-key input and triggering Sketch callbacks when updates need to be sent to the server. Contains a 'DancerObj' that renders the avatar and handles events from the 'dancer' instrument.
				- DancerObj.ts — defines a simple character rig for the avatar, with joint rotations and translation offsets set by ADSR envelopes which are triggered by the 'dancer' instrument
				- Ground.ts — renders the ground plane
		- vendor/p5.easycam.js — a customised version of [p5.easycam](https://github.com/diwi/p5.EasyCam)

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
