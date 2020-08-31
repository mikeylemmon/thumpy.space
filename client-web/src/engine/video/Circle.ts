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
		return {
			id: `${Circle.TypeId}-${circleId}`,
			name: 'Circle',
			typeId: Circle.TypeId,
			triggers: Circle.StateInputs(),
			fields: [],
		}
	}

	public subengine: SubengineType = Circle.Subengine

	private radius: number = 80

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

	sketch = (pp: p5) => {
		const width = 500
		pp.setup = () => {
			console.log('[Circle #sketch.setup] width:', width)
			pp.createCanvas(width, width)
		}

		pp.draw = () => {
			pp.clear()
			pp.ellipse(width / 2, width / 2, this.radius, this.radius)
		}
	}
}

registerInstrumentType(Circle)
