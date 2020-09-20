// import * as p5 from 'p5'
import { Draw } from 'tone'
import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'
import { EngineInstrument, SubengineType } from 'engine/EngineInstrument'
import { registerInstrumentType } from 'engine/Engine'

let puddleishId = 0,
	reflections = 5

type Shape = 'circle' | 'square' | 'triangle'
const shapes: Shape[] = ['circle', 'square', 'triangle']

class SynthNote {
	trig: Trigger
	age: number = 0
	rand: number = Math.random()
	lifespan: number = Math.floor(this.rand * 50 + 30)
	freqNorm: number // frequency normalized to 0-1
	radius: number
	dist: number
	theta: number
	hue: number
	sat: number
	lgt: number
	shape: Shape = shapes[Math.floor(this.rand * shapes.length)]
	spin: number = 0
	spinVel: number = 0 // velocity at which the shape is spinning (in rads per frame)
	lighten: number = 0

	constructor(width: number, height: number, trig: Trigger) {
		this.trig = trig
		this.freqNorm = 1 - (52 - this.trig.freq) / 8
		this.hue = (1 - this.freqNorm) * 360.0
		this.sat = 60
		this.lgt = 56
		const size = Math.min(width, height)
		this.radius = (this.rand * size) / 20 + size / 10
		this.dist = (this.freqNorm * size * 0.7) / 2 - this.radius + size * 0.2
		this.theta = Math.random() * 2 * Math.PI
		// console.log('[SynthNote #constructor]', this)
	}

	isAlive(): boolean {
		return this.age < this.lifespan
	}

	draw(pp: p5) {
		this.age++
		this.spin += this.spinVel
		this.spinVel *= 0.97
		this.lighten *= 0.8
		const aa = this.age / this.lifespan
		const rad = this.radius * aa + this.radius / 2
		pp.colorMode(pp.HSL, 360, 100, 100, 1)
		const lgt = this.lgt + this.lighten
		pp.stroke(this.hue, this.sat, lgt, 1.0 - Math.max(0, aa - 0.3))
		pp.strokeWeight(10)
		pp.fill(0, 0)
		const delta = (Math.PI * 2) / reflections
		for (let ii = 0; ii < reflections; ii++) {
			let rot = this.theta + delta * ii
			const xx = pp.width / 2 + Math.sin(rot) * this.dist
			const yy = pp.height / 2 + Math.cos(rot) * this.dist
			rot += this.spin
			switch (this.shape) {
				case 'circle':
					pp.circle(xx, yy, rad)
					break
				case 'square':
					// pp.square(xx, yy, rad)
					pp.quad(
						xx + (Math.sin(rot) * rad) / 2,
						yy + (Math.cos(rot) * rad) / 2,
						xx + (Math.sin(rot + Math.PI / 2) * rad) / 2,
						yy + (Math.cos(rot + Math.PI / 2) * rad) / 2,
						xx + (Math.sin(rot + Math.PI) * rad) / 2,
						yy + (Math.cos(rot + Math.PI) * rad) / 2,
						xx + (Math.sin(rot + (Math.PI * 3) / 2) * rad) / 2,
						yy + (Math.cos(rot + (Math.PI * 3) / 2) * rad) / 2,
					)
					break
				case 'triangle':
					pp.triangle(
						xx + (Math.sin(rot) * rad) / 2,
						yy + (Math.cos(rot) * rad) / 2,
						xx + (Math.sin(rot + (Math.PI * 2) / 3) * rad) / 2,
						yy + (Math.cos(rot + (Math.PI * 2) / 3) * rad) / 2,
						xx + (Math.sin(rot + (Math.PI * 4) / 3) * rad) / 2,
						yy + (Math.cos(rot + (Math.PI * 4) / 3) * rad) / 2,
					)
					break
			}
		}
	}
}

export const TriggerDropsId = 'drops'
export const TriggerWeatherId = 'weather'

// Puddleish statically implements EngineInstrumentStatic
export default class Puddleish extends EngineInstrument {
	static DisplayName: string = 'Puddleish'
	static Subengine: SubengineType = 'video'
	static TypeId: string = 'video-puddleish'

	static StateInputs(): StateInstrumentInput[] {
		return [
			{ id: TriggerDropsId, name: 'Drops' },
			{ id: TriggerWeatherId, name: 'Weather' },
		]
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

	private width: number = 0
	private height: number = 0
	private notes: SynthNote[] = []
	private darkenBg: number = 0

	constructor(initialState: Partial<StateInstrument> = Puddleish.StateDefault()) {
		super()
		console.log('[Puddleish #constructor] New puddleish', initialState)
	}

	dispose(): void {
		console.log('[Puddleish #dispose] Disposed')
	}

	trigger(time: Time, inputId: string, trig: Trigger): void {
		Draw.schedule(() => {
			if (inputId === 'drops') {
				this.addNote(trig)
				return
			}
			// Weather
			switch (trig.freq) {
				case 45:
					this.notes.forEach(nn => (nn.shape = shapes[Math.floor(Math.random() * shapes.length)]))
					break
				case 46:
					this.notes.forEach(nn => (nn.radius -= 25))
					// this.darkenBg -= 10
					break
				case 47:
				case 48:
					break
				case 49:
					reflections = Math.floor(Math.random() * 8) + 2
					break
				case 50:
				case 51:
					this.notes.forEach(nn => (nn.lighten += 10))
					break
				case 52:
					const sign = Math.random() > 0.5 ? -1 : 1
					this.notes.forEach(nn => (nn.spinVel += (sign * Math.PI) / 30))
					break
			}
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
			this.notes = this.notes.filter(nn => nn.isAlive())
			this.darkenBg *= 0.9
			pp.colorMode(pp.HSL, 255, 255, 255, 1)
			pp.background(0, 0, 0x33 + this.darkenBg)
			for (const nn of this.notes) {
				nn.draw(pp)
			}
		}

		pp.mousePressed = () => {}
	}
}

registerInstrumentType(Puddleish)
