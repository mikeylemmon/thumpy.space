import * as p5 from 'p5'
import { UserEvent } from './serverApi/serverApi'
import Sketch from './Sketch'
import {
	KEYCODE_BACKSPACE,
	KEYCODE_CONTROL,
	KEYCODE_DELETE,
	KEYCODE_SHIFT,
	KEYCODE_ENTER,
	KEYCODE_RETURN,
} from './constants'
import { radBig, radSmall, Loop, LoopData } from './Loop'

type LoopsOpts = {
	sketch: Sketch
	recOffset: number
}

const defaultLoopParams = { beats: 8, radius: radSmall }

export class Loops {
	sketch: Sketch
	dial: Loop
	loops: Loop[] = []
	activeLoop: Loop
	inputs: {
		loopLen?: any
		newLoopBtn?: any
	} = {}
	recLock = false
	hidden = false
	hiddenDial = false
	loaded = false

	constructor(opts: LoopsOpts) {
		this.sketch = opts.sketch
		this.dial = new Loop({
			beats: this.dialBeats(opts.recOffset),
			radius: radBig,
			isDial: true,
		})
		this.activeLoop = new Loop({ beats: 8, radius: radBig })
	}

	load = () => {
		const { sketch } = this
		const store = sketch.localStorage
		const lidsStr = store.getItem('loops')
		const aid = store.getItem('activeLoop')
		let activeLoop: Loop | null = null
		if (lidsStr && lidsStr !== '') {
			const lids = JSON.parse(lidsStr)
			for (const lid of lids) {
				const loop = new Loop({ id: lid, ...defaultLoopParams })
				if (loop.loaded) {
					// loop loaded successfully from local storage, add to loops
					loop.updateClientId(sketch.user.clientId)
					this.loops.push(loop)
					if (lid === aid) {
						activeLoop = loop
					}
				}
			}
		}
		if (activeLoop) {
			this.activeLoop = activeLoop
			return activeLoop
		}
		this.activeLoop = new Loop(defaultLoopParams)
		this.loops.push(this.activeLoop)
		return this.activeLoop
	}

	saveLoopRefs = () => {
		const store = this.sketch.localStorage
		store.setItem('activeLoop', this.activeLoop.id)
		store.setItem('loops', JSON.stringify(this.loops.map(ll => ll.id)))
	}

	copyToClipboard = async () => {
		await navigator.clipboard.writeText(JSON.stringify(this.activeLoop.data()))
		console.log('[Loops #copyToClipboard] Data saved to clipboard')
	}
	pasteFromClipboard = async () => {
		const dataStr = await navigator.clipboard.readText()
		if (!dataStr || dataStr === '') {
			console.log('[Loops #copyToClipboard] No data to paste')
			return
		}
		try {
			const data = JSON.parse(dataStr) as LoopData
			if (!data || !data.id || data.id === '' || !data.beats || !data.evts || !data.evts.length) {
				console.log('[Loops #copyToClipboard] Unable to parse pasted data', data, { dataStr })
				return
			}
			const loop = new Loop(defaultLoopParams)
			const newId = loop.id
			loop.loadData(data)
			if (loop.loaded) {
				// loop loaded successfully from local storage, add to loops
				loop.id = newId
				loop.updateClientId(this.sketch.user.clientId)
				loop.isMuted = true
				this.loops.push(loop)
				this.activateLoop(loop)
				loop.save()
				this.saveLoopRefs()
				console.log('[Loops #pasteFromClipboard] New loop loaded from clipboard')
			}
		} catch (err) {
			console.log('[Loops #copyToClipboard] Unable to parse pasted data', err, dataStr)
		}
	}

	update = () => {
		if (!this.loaded) {
			this.activeLoop = this.load()
			this.loaded = true
		}
		this.dial.update()
		this.loops.forEach(ll => ll.update())
	}

	draw = (pp: p5) => {
		const { activeLoop, didSetup, hidden, hiddenDial } = this
		if (hidden) {
			if (didSetup) {
				this.inputs.loopLen.remove()
				this.inputs.newLoopBtn.remove()
				this.didSetup = false
			}
		} else if (!didSetup) {
			this.setupInputs(pp)
		}
		const { loopLen, newLoopBtn } = this.inputs

		// Draw active loop
		let rad = radBig
		let yy = rad + 20
		let xx = pp.width - 20
		if (!hidden) {
			activeLoop.isActive = true
			activeLoop.setRadius(rad)
			activeLoop.isRecording = this.isRecording(pp)
			xx -= rad + 20
			activeLoop.draw(pp, xx, yy)
			pp.fill(210).stroke(0).strokeWeight(1)
			pp.textSize(14).textAlign(pp.CENTER, pp.TOP)
			pp.text(`Active loop: ${loopLen.value()} beats`, xx, yy + rad + 10)
			loopLen.position(xx - 60, yy + rad + 30)
			const btnHalfwidth = Math.max(48, Math.floor(newLoopBtn.elt.offsetWidth / 2))
			newLoopBtn.position(xx - btnHalfwidth, yy + rad + 60)
			xx -= rad + 20
		}

		if (!hiddenDial) {
			// Draw metronome dial
			rad = this.dial.opts.radius
			xx -= rad + 20
			this.dial.draw(pp, xx, yy)
			pp.fill(210).stroke(0).strokeWeight(1)
			pp.textSize(14).textAlign(pp.CENTER, pp.TOP)
			pp.text('Metronome', xx, yy + rad + 10)
		}

		if (hidden) {
			return
		}

		yy = newLoopBtn.y + newLoopBtn.elt.offsetHeight + 20

		const othersTop = yy
		rad = radSmall
		xx = pp.width - rad - 20
		for (const ll of this.inactiveLoops()) {
			ll.isActive = false
			ll.setRadius(radSmall)
			yy += rad
			ll.draw(pp, xx, yy)
			if (pp.keyIsDown(KEYCODE_SHIFT)) {
				// inform user they can click here to delete this loop
				pp.fill(50, 150).noStroke()
				pp.circle(xx, yy, rad * 2)
				pp.fill(200).textSize(12).textStyle(pp.NORMAL).textAlign(pp.CENTER, pp.CENTER)
				pp.text('Click to\ndelete', xx, yy)
			}
			yy += rad + 20
			if (yy > pp.height - rad * 3) {
				yy = othersTop
				xx -= rad * 2 + 20
			}
		}
	}

	didSetup = false
	setupInputs = (pp: p5) => {
		this.didSetup = true
		this.inputs.loopLen = pp.createSlider(1, 64, this.activeLoop.opts.beats) as any
		this.inputs.newLoopBtn = pp.createButton('Add new loop') as any
		const { loopLen, newLoopBtn } = this.inputs
		loopLen.size(120)
		loopLen.input(() => {
			this.activeLoop.opts.beats = loopLen.value()
			this.activeLoop.save()
		})
		newLoopBtn.mousePressed(this.addLoop)
	}

	dialBeats = (recOffset: number) => 4 * Math.ceil((recOffset + 1) / 4)

	updateRecOffset = (off: number) => {
		this.dial.opts.beats = this.dialBeats(off)
	}

	loopUserEvent = (evt: UserEvent) => {
		this.activeLoop.loopUserEvent(evt)
	}

	clearAll = () => {
		this.loops.forEach(ll => ll.clearAllEvents())
	}

	clearActiveLoop = () => {
		this.activeLoop.clearAllEvents()
	}

	updateClientId = (clientId: number) => {
		this.loops.forEach(ll => ll.updateClientId(clientId))
	}

	toggleActiveLoopMute = () => {
		const al = this.activeLoop
		al.isMuted = !al.isMuted
		al.save()
	}

	muteAll = () => {
		for (const ll of this.loops) {
			if (!ll.isMuted) {
				ll.isMuted = true
				ll.save()
			}
		}
	}

	toggleHide = () => (this.hidden = !this.hidden)
	toggleHideText = () => (this.hidden ? 'Show Loops' : 'Hide Loops')
	toggleHideDial = () => (this.hiddenDial = !this.hiddenDial)
	toggleHideDialText = () => (this.hiddenDial ? 'Show Metronome' : 'Hide Metronome')

	stopRecording = () => {
		this.activeLoop.sanitizeEvents()
		this.activeLoop.save()
	}

	addLoop = () => {
		this.activeLoop = new Loop({
			beats: this.inputs.loopLen.value(),
			radius: radBig,
		})
		this.loops.push(this.activeLoop)
		this.saveLoopRefs()
	}

	inactiveLoops = () => this.loops.filter(ll => ll !== this.activeLoop)

	mousePressed = (pp: p5) => {
		let didHit = false
		for (const loop of this.inactiveLoops()) {
			if (loop.hitTest(pp.mouseX, pp.mouseY)) {
				didHit = true
				if (pp.keyIsDown(KEYCODE_SHIFT)) {
					// Remove loop
					loop.remove()
					this.loops = this.loops.filter(ll => ll !== loop)
					break
				}
				this.activateLoop(loop)
				break
			}
		}
		if (didHit) {
			this.saveLoopRefs()
		}
	}

	activateLoop = (loop: Loop) => {
		this.activeLoop.isActive = false
		this.inputs.loopLen.value(loop.opts.beats)
		this.activeLoop = loop
		loop.isActive = true
	}

	keyPressed = (evt: p5) => {
		if (evt.keyCode === KEYCODE_BACKSPACE || evt.keyCode === KEYCODE_DELETE) {
			this.clearActiveLoop()
			return
		}
		if (evt.keyCode === KEYCODE_ENTER || evt.keyCode === KEYCODE_RETURN) {
			this.recLock = !this.recLock
			if (!this.recLock) {
				this.stopRecording()
			}
			return
		}
		switch (evt.key) {
			case 'c':
				if (evt.keyIsDown(KEYCODE_CONTROL)) {
					this.copyToClipboard()
				}
				return
			case 'v':
				if (evt.keyIsDown(KEYCODE_CONTROL)) {
					this.pasteFromClipboard()
				}
				return
			case '\\':
			case '|':
			case 'm':
				if (evt.keyIsDown(KEYCODE_CONTROL)) {
					this.muteAll()
				} else {
					this.toggleActiveLoopMute()
				}
				return
			case '[':
			case ',':
				return this.activatePrev()
			case ']':
			case '.':
				return this.activateNext()
		}
	}

	activatePrev = () => {
		const { loops } = this
		for (let ii = 0; ii < loops.length; ii++) {
			if (loops[ii] === this.activeLoop) {
				if (ii === 0) {
					this.activateLoop(loops[loops.length - 1])
				} else {
					this.activateLoop(loops[ii - 1])
				}
				return
			}
		}
	}

	activateNext = () => {
		const { loops } = this
		for (let ii = 0; ii < loops.length; ii++) {
			if (loops[ii] === this.activeLoop) {
				if (ii === loops.length - 1) {
					this.activateLoop(loops[0])
				} else {
					this.activateLoop(loops[ii + 1])
				}
				return
			}
		}
	}

	keyReleased = (evt: p5) => {
		if (evt.keyCode === KEYCODE_SHIFT) {
			// Stopped recording to loop, cleanup any dangling notes
			this.stopRecording()
		}
	}

	isRecording = (pp?: p5): boolean => {
		return this.recLock || (!!pp && pp.keyIsDown(KEYCODE_SHIFT))
	}
}
