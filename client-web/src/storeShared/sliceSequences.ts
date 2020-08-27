import { createEntityAdapter, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'

export const sliceNameSequences = 'sequences'

export type Trigger = {
	freq: number
	// unit: 'midi' | 'hz' | 'note'
	unit: 'number' | 'midi' | 'hz' | 's' | 'n' | 't' | 'm' | 'i' | 'tr' | 'samples' | undefined
	dur: string
}

export type Step = {
	triggers: Trigger[]
}

export type StateSequenceOutput = {
	instrumentId: string
	inputId: string
}

export type StateSequence = {
	id: string
	name: string
	steps: Step[]
	outputs: StateSequenceOutput[]
}

export type SeqStepTrigger = {
	seqId: string
	stepId: number
	trigger: Trigger
}

export const adapterSequences = createEntityAdapter<StateSequence>()
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
				seq.steps[stepId] = { triggers: [] }
			}
			seq.steps[stepId].triggers.push(trigger)
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
			step.triggers = step.triggers.filter(trig => trig.freq !== trigger.freq)
			return state
		},
	},
})

export type StateSequences = EntityState<StateSequence>

export const actionsSequences = sliceSequences.actions

export default sliceSequences.reducer
