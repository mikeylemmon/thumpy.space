import { createEntityAdapter, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuid } from 'uuid'

export const sliceNameSequences = 'sequences'

export type Trigger = {
	freq: number
	unit: 'number' | 'midi' | 'hz' | 's' | 'n' | 't' | 'm' | 'i' | 'tr' | 'samples' | undefined
	dur: string
}

export type Step = {
	id: number
	triggers: Trigger[]
}

export type EventType = 'noteon' | 'noteoff' | 'controlchange' | 'keyaftertouch' | 'pitchbend'

export type Event = {
	id: string
	timestamp: number
	raw: number[]
	kind: EventType
	value: number
	note: number // midinote
}

export type StateSequenceOutput = {
	instrumentId: string
	inputId: string
}

export type StateSequence = {
	id: string
	name: string
	steps: Step[]
	events: Event[]
	outputs: StateSequenceOutput[]
	currentStep: number
}

export type SeqStep = {
	seqId: string
	stepId: number
}

export type SeqStepTrigger = {
	seqId: string
	stepId: number
	trigger: Trigger
}

export type SeqEvent = {
	seqId: string
	event: Partial<Event>
}

export type SeqEventRef = {
	seqId: string
	eventId: string
}

export const adapterSequences = createEntityAdapter<StateSequence>()
export const stateInitialSequences = adapterSequences.getInitialState()
const sliceSequences = createSlice({
	name: sliceNameSequences,
	initialState: stateInitialSequences,
	reducers: {
		addOne: adapterSequences.addOne,
		eventAdd(state, action: PayloadAction<SeqEvent>) {
			const { seqId, event } = action.payload
			const seq = state.entities[seqId]
			if (!seq) {
				console.error(`[eventAdd] Cannot add event: no sequence found with id ${seqId}`)
				return state
			}
			event.id = uuid()
			seq.events.push(event as Event)
			return state
		},
		eventDelete(state, action: PayloadAction<SeqEventRef>) {
			const { seqId, eventId } = action.payload
			const seq = state.entities[seqId]
			if (!seq) {
				console.error(`[eventDelete] Cannot delete event: no sequence found with id ${seqId}`)
				return state
			}
			const prevLen = seq.events.length
			seq.events = seq.events.filter(evt => evt.id !== eventId)
			const numDeleted = prevLen - seq.events.length
			if (numDeleted !== 1) {
				console.error(
					`[eventDelete] Expected to delete 1 event in ${seqId} with id ${eventId}, instead deleted ${numDeleted}`,
				)
			}
			return state
		},
		triggerOn(state, action: PayloadAction<SeqStepTrigger>) {
			const { seqId, stepId, trigger } = action.payload
			const seq = state.entities[seqId]
			if (!seq) {
				console.error(`[triggerOn] Cannot add trigger: no sequence found with id ${seqId}`)
				return state
			}
			if (!seq.steps[stepId]) {
				seq.steps[stepId] = { id: stepId, triggers: [] }
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
		setCurrentStep(state, action: PayloadAction<SeqStep>) {
			const { seqId, stepId } = action.payload
			const seq = state.entities[seqId]
			if (!seq) {
				console.error(`[setStep] Cannot set step: no sequence found with id ${seqId}`)
				return state
			}
			seq.currentStep = stepId
			return state
		},
	},
})

export type StateSequences = EntityState<StateSequence>

export const actionsSequences = sliceSequences.actions

export default sliceSequences.reducer
