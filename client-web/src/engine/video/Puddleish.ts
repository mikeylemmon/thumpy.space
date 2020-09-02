// import * as p5 from 'p5'
import { Draw } from 'tone'
import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'
import { EngineInstrument, SubengineType } from 'engine/EngineInstrument'
import { registerInstrumentType } from 'engine/Engine'

let puddleishId = 0

class SynthNote {
	trig: Trigger
	age: number = 0
	rand: number = Math.random()
	lifespan: number = Math.floor(this.rand * 90 + 30)
	freqNorm: number // frequency normalized to 0-1
	radius: number
	dist: number
	theta: number
	hue: number
	sat: number
	lgt: number
	reflections: number = 5

	constructor(width: number, height: number, trig: Trigger) {
		this.trig = trig
		this.freqNorm = 1 - (52 - this.trig.freq) / 8
		this.hue = (1 - this.freqNorm) * 360.0
		this.sat = 60
		this.lgt = 56
		const size = Math.min(width, height)
		this.radius = (this.rand * size) / 20 + size / 15
		this.dist = (this.freqNorm * size * 0.7) / 2 - this.radius + size * 0.2
		this.theta = Math.random() * 2 * Math.PI
		console.log('[SynthNote #constructor]', this)
	}

	isAlive(): boolean {
		return this.age < this.lifespan
	}

	draw(pp: p5) {
		this.age++
		const aa = this.age / this.lifespan
		const rad = this.radius * aa + this.radius / 2
		pp.colorMode(pp.HSL, 360, 100, 100, 1)
		pp.stroke(this.hue, this.sat, this.lgt, 1.0 - aa)
		pp.strokeWeight(10)
		pp.fill(0, 0)
		const delta = (Math.PI * 2) / this.reflections
		for (let ii = 0; ii < this.reflections; ii++) {
			const xx = pp.width / 2 + Math.sin(this.theta + delta * ii) * this.dist
			const yy = pp.height / 2 + Math.cos(this.theta + delta * ii) * this.dist
			pp.ellipse(xx, yy, rad, rad)
		}
	}
}

// Puddleish statically implements EngineInstrumentStatic
export default class Puddleish extends EngineInstrument {
	static DisplayName: string = 'Puddleish'
	static Subengine: SubengineType = 'video'
	static TypeId: string = 'video-puddleish'

	static StateInputs(): StateInstrumentInput[] {
		return [{ id: 'trigger', name: 'Trigger' }]
	}

	static StateDefault(): StateInstrument {
		const idStr = puddleishId > 0 ? ` ${puddleishId + 1}` : ''
		return {
			id: `${Puddleish.TypeId}-${puddleishId}`,
			name: `Puddleish${idStr}`,
			typeId: Puddleish.TypeId,
			subengine: Puddleish.Subengine,
			triggers: Puddleish.StateInputs(),
			fields: [],
		}
	}

	public subengine: SubengineType = Puddleish.Subengine

	private radius: number = 80
	private width: number = 500
	private height: number = 500
	private notes: SynthNote[] = []

	constructor(initialState: Partial<StateInstrument> = Puddleish.StateDefault()) {
		super()
		console.log('[Puddleish #constructor] New puddleish', initialState)
	}

	dispose(): void {
		console.log('[Puddleish #dispose] Disposed')
	}

	trigger(time: Time, _inputId: string, trig: Trigger): void {
		Draw.schedule(() => {
			// this.radius = Math.floor(Math.random() * 15 + (trig.freq - 44) * 20)
			// console.log('[Puddleish #trigger] trigger:', this.radius, trig.freq)
			this.addNote(trig)
		}, time)
	}

	addNote(trig: Trigger) {
		this.notes.push(new SynthNote(this.width, this.height, trig))
	}

	updateState(inst: StateInstrument): void {
		console.log('[Puddleish #updateState] Received new state', inst)
	}

	setSize(width: number, height: number) {
		this.width = width
		this.height = height
	}

	sketch = (pp: p5) => {
		pp.setup = () => {
			console.log(`[Puddleish #sketch.setup] ${this.width} x ${this.height}`)
			pp.createCanvas(this.width, this.height)
		}

		pp.draw = () => {
			pp.clear()
			this.notes = this.notes.filter(nn => nn.isAlive())
			for (const nn of this.notes) {
				nn.draw(pp)
			}
		}

		pp.mousePressed = () => {}
	}
}

registerInstrumentType(Puddleish)
