import { createEntityAdapter, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'

export const sliceNameSequences = 'sequences'

export type Trigger = {
	freq: number
	unit: 'midi' | 'hz' | 'note'
	dur: string
}

export type Step = Trigger[]

export type Sequence = {
	id: string
	name: string
	steps: Step[]
}

export type SeqStepTrigger = {
	seqId: string
	stepId: number
	trigger: Trigger
}

export const adapterSequences = createEntityAdapter<Sequence>()
export const stateInitialSequences = adapterSequences.getInitialState()
const sliceSequences = createSlice({
	name: sliceNameSequences,
	initialState: stateInitialSequences,
	reducers: {
		addOne: adapterSequences.addOne,
		triggerOn(state, action: PayloadAction<SeqStepTrigger>) {
			const { seqId, stepId, trigger } = action.payload
			const seq = state.entities[seqId]
			if (!seq) {
				console.error(`[triggerOn] Cannot add trigger: no sequence found with id ${seqId}`)
				return state
			}
			if (!seq.steps[stepId]) {
				seq.steps[stepId] = []
			}
			seq.steps[stepId].push(trigger)
			return state
		},
		triggerOff(state, action: PayloadAction<SeqStepTrigger>) {
			const { seqId, stepId, trigger } = action.payload
			const seq = state.entities[seqId]
			if (!seq) {
				console.error(`[triggerOff] Cannot remove trigger: no sequence found with id ${seqId}`)
				return state
			}
			const step = seq.steps[stepId]
			if (!step) {
				console.error(`[triggerOff] Cannot remove trigger: no triggers found for step id ${stepId}`)
				return state
			}
			seq.steps[stepId] = step.filter(trig => trig.freq !== trigger.freq)
			return state
		},
	},
})

export type StateSequences = EntityState<Sequence>

export const actionsSequences = sliceSequences.actions

export default sliceSequences.reducer
