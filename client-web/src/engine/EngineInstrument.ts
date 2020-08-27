import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'

export type SubengineType = 'audio' | 'video'
export const subengines: SubengineType[] = ['audio', 'video']

export interface EngineInstrumentStatic {
	DisplayName: string
	Subengine: SubengineType
	TypeId: string
	StateInputs(): StateInstrumentInput[]
	StateDefault(): StateInstrument
	new (...args: any[]): EngineInstrument
}

export abstract class EngineInstrument {
	abstract dispose(): void
	abstract trigger(time: Time, inputId: string, trig: Trigger): void
	abstract updateState(inst: StateInstrument): void
}

export type EngineInstrumentTypeListItem = {
	index: number
	displayName: string
}
export type EngineInstrumentTypeList = EngineInstrumentTypeListItem[]
