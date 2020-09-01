// import * as p5 from 'p5'
import { Draw } from 'tone'
import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'
import { EngineInstrument, SubengineType } from 'engine/EngineInstrument'
import { registerInstrumentType } from 'engine/Engine'

let circleId = 0

// Circle statically implements EngineInstrumentStatic
export default class Circle extends EngineInstrument {
	static DisplayName: string = 'Circle'
	static Subengine: SubengineType = 'video'
	static TypeId: string = 'video-circle'

	static StateInputs(): StateInstrumentInput[] {
		return [{ id: 'trigger', name: 'Trigger' }]
	}

	static StateDefault(): StateInstrument {
		const idStr = circleId > 0 ? ` ${circleId + 1}` : ''
		return {
			id: `${Circle.TypeId}-${circleId}`,
			name: `Circle${idStr}`,
			typeId: Circle.TypeId,
			subengine: Circle.Subengine,
			triggers: Circle.StateInputs(),
			fields: [],
		}
	}

	public subengine: SubengineType = Circle.Subengine

	private radius: number = 80
	private width: number = 500
	private height: number = 500

	constructor(initialState: Partial<StateInstrument> = Circle.StateDefault()) {
		super()
		console.log('[Circle #constructor] New circle', initialState)
	}

	dispose(): void {
		console.log('[Circle #dispose] Disposed')
	}

	trigger(time: Time, _inputId: string, trig: Trigger): void {
		Draw.schedule(() => {
			this.radius = Math.floor(Math.random() * 15 + (trig.freq - 44) * 20)
			// console.log('[Circle #trigger] trigger:', this.radius, trig.freq)
		}, time)
	}

	updateState(inst: StateInstrument): void {
		console.log('[Circle #updateState] Received new state', inst)
	}

	setSize(width: number, height: number) {
		this.width = width
		this.height = height
	}

	sketch = (pp: p5) => {
		pp.setup = () => {
			console.log(`[Circle #sketch.setup] ${this.width} x ${this.height}`)
			pp.createCanvas(this.width, this.height)
		}

		pp.draw = () => {
			pp.clear()
			pp.ellipse(this.width / 2, this.height / 2, this.radius, this.radius)
		}

		pp.mousePressed = () => {}
	}
}

registerInstrumentType(Circle)
