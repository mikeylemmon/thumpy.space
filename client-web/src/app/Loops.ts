import * as p5 from 'p5'
import { UserEvent } from './serverApi/serverApi'
import Sketch from './Sketch'
import { KEYCODE_SHIFT } from './constants'
import { radBig, radSmall, Loop } from './Loop'

type LoopsOpts = {
	sketch: Sketch
	recOffset: number
}

export class Loops {
	sketch: Sketch
	dial: Loop
	loops: Loop[] = []
	activeLoop: Loop
	inputs: {
		loopLen?: any
		newLoopBtn?: any
	} = {}
	hidden = false
	hiddenDial = false

	constructor(opts: LoopsOpts) {
		this.sketch = opts.sketch
		this.dial = new Loop({
			beats: this.dialBeats(opts.recOffset),
			radius: radBig,
			sketch: opts.sketch,
			isDial: true,
		})
		this.activeLoop = this.load()
	}

	saveAll = () => {
		this.saveLoopRefs()
		this.loops.forEach(ll => ll.save())
		console.log('[Loops #save] Saved all loops to local storage')
	}
	saveLoopRefs = () => {
		const store = this.sketch.localStorage
		store.setItem('activeLoop', this.activeLoop.id)
		store.setItem('loops', JSON.stringify(this.loops.map(ll => ll.id)))
	}

	load = () => {
		const { sketch } = this
		const store = sketch.localStorage
		const lidsStr = store.getItem('loops')
		const defaultParams = { beats: 8, radius: radSmall, sketch }
		const aid = store.getItem('activeLoop')
		let activeLoop: Loop | null = null
		if (lidsStr && lidsStr !== '') {
			const lids = JSON.parse(lidsStr)
			for (const lid of lids) {
				const loop = new Loop({ id: lid, ...defaultParams })
				if (loop.loaded) {
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
		this.activeLoop = new Loop(defaultParams)
		this.loops.push(this.activeLoop)
		return this.activeLoop
	}

	update = () => {
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
			activeLoop.isRecording = pp.keyIsDown(KEYCODE_SHIFT)
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
			sketch: this.sketch,
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
					this.loops = this.loops.filter(ll => ll !== loop)
					break
				}
				this.inputs.loopLen.value(loop.opts.beats)
				this.activeLoop.isActive = false
				this.activeLoop = loop
				loop.isActive = true
				break
			}
		}
		if (didHit) {
			this.saveLoopRefs()
		}
	}
}
