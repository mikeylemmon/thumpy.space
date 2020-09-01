import { createEntityAdapter, createSlice, EntityState } from '@reduxjs/toolkit'

export const sliceNameInstruments = 'instruments'

export type StateInstrumentInput = {
	id: string
	name: string
}

export type StateInstrumentFieldBase = {
	id: string
	name: string
}
export type StateInstrumentFieldFloat = StateInstrumentFieldBase & {
	rangeMin: number
	rangeMax: number
	default: number
}
export type StateInstrumentField = StateInstrumentFieldFloat

// Instrument creates audio or video output based on triggers received from StateSequence(s)
export type StateInstrument = {
	id: string
	name: string
	typeId: string
	subengine: string
	triggers: StateInstrumentInput[]
	fields: StateInstrumentField[]
}

export const adapterInstruments = createEntityAdapter<StateInstrument>()
export const stateInitialInstruments = adapterInstruments.getInitialState()
const sliceInstruments = createSlice({
	name: sliceNameInstruments,
	initialState: stateInitialInstruments,
	reducers: {
		addOne: adapterInstruments.addOne,
	},
})

export type StateInstruments = EntityState<StateInstrument>

export const actionsInstruments = sliceInstruments.actions

export default sliceInstruments.reducer
