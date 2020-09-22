import { immediate, now, Sequence, Transport } from 'tone'
import * as Tone from 'tone'
import { StateSequence, StateSequenceOutput, Step, Trigger } from 'storeShared/sliceSequences'
import storeLocal from 'storeLocal/storeLocal'
import { EventType } from 'storeShared/sliceSequences'
import apiSequences from 'storeLocal/apiSequences'
import { EngineInstrument } from 'engine/EngineInstrument'
import WSClient from 'serverApi/WSClient'

type TickEvent = {
	seq: StateSequence
	step: Step
}

type MidiInputChannel = {
	eventMap: any // {...}
	eventsSuspended: boolean
	input: any // Input
	number: number
}
type MidiNote = {
	_number: number
	_duration: number
	_rawAttack: number
	_rawRelease: number
}
type MidiNoteEvent = {
	attack: number
	data: number[]
	note: MidiNote
	rawAttack: number
	// rawData: UintArray
	rawData: number[]
	target: MidiInputChannel
	timestamp: number
	type: string
}

function tickEvents(seq: StateSequence): TickEvent[] {
	return seq.steps.map((step: Step) => ({ seq, step }))
}

function seqOutputKey(output: StateSequenceOutput): string {
	return `${output.instrumentId}-${output.inputId}`
}

export class EngineSequence {
	private sequencer: Sequence
	private outputs: { [key: string]: EngineInstrument }
	private state: StateSequence

	constructor(state: StateSequence) {
		const isSeq1 = state.id === 'seq-1'
		this.sequencer = new Sequence(
			this.tick,
			tickEvents(state),
			isSeq1 ? '8n' : '16n', // TODO: parameterize in StateSequence
		).start(0)
		this.outputs = {}
		this.state = state

		if (!isSeq1) {
			return
		}

		let timeGlobalToTone = (globalTime: number) => {
			return globalTime
		}
		let timeToneToGlobal = (toneTime: number) => {
			return toneTime
		}

		window.now = () => {
			timeToneToGlobal(timeGlobalToTone(wsClient.now()))
			timeGlobalToTone(timeToneToGlobal(Tone.immediate()))
			timeGlobalToTone(timeToneToGlobal(Tone.now()))
		}

		const wsClient = new WSClient(window, {
			clock: {
				onSynced: window.now,
			},
		})

		timeGlobalToTone = (globalTime: number) => {
			const rawCtx = Tone.context.rawContext as any
			const { contextTime, performanceTime } = rawCtx._nativeAudioContext.getOutputTimestamp()
			const lt = wsClient.clock.toLocal(globalTime)
			const delta = lt - performanceTime
			const toneTime = contextTime + delta / 1000
			console.log(
				'[EngineSequence #timeGlobalToTone]',
				globalTime,
				'>',
				toneTime * 1000,
				`(d:${(toneTime - contextTime) * 1000})`,
			)
			return toneTime
		}
		timeToneToGlobal = (toneTime: number) => {
			const rawCtx = Tone.context.rawContext as any
			const { contextTime, performanceTime } = rawCtx._nativeAudioContext.getOutputTimestamp()
			const delta = toneTime - contextTime
			const pt = performanceTime + delta * 1000
			const globalTime = wsClient.clock.toGlobal(pt)
			console.log('[EngineSequence #timeToneToGlobal]', toneTime * 1000, '>', globalTime)
			return globalTime
		}

		window.Tone = Tone

		// Listen for midi input and forward note triggers to outputs
		const { WebMidi } = window
		console.log('WebMidi', WebMidi)
		WebMidi.enable()
			.then(() => {
				const { inputs, outputs } = WebMidi
				console.log('WebMidi enabled')
				console.log('WebMidi inputs', inputs)
				console.log('WebMidi outputs', outputs)
				const allChannels = [...Array(16).keys()].map(x => x + 1)
				for (const input of inputs) {
					for (const eventName of [
						'songposition',
						'songselect',
						'sysex',
						'timecode',
						'tunerequest',
						// 'clock',
						'start',
						'continue',
						'stop',
						'activesensing',
						'reset',
						'opened',
						'closed',
						'disconnected',
						// 'midimessage',
						'unknownmidimessage',
					]) {
						input.addListener(eventName, (evt: any) => {
							if (
								(eventName === 'midimessage' && evt.data[0] === 248) ||
								eventName === 'clock'
							) {
								return
							}
							const { data } = evt
							console.log('[MIDI] Received', eventName, data, evt)
						})
					}
					for (const eventName of [
						// 'channelaftertouch',
						'controlchange',
						'keyaftertouch',
						'noteoff',
						'noteon',
						// 'nrpn',
						'pitchbend',
						// 'programchange',
						// 'channelmode',
					]) {
						input.addListener(
							eventName,
							(evt: any) => {
								const { attack, data, note, target, value } = evt
								// const { data, target } = evt
								const { number: channel } = target || {}
								console.log(`[MIDI] Received (${channel})`, eventName, data, evt)
								storeLocal.dispatch(
									apiSequences.event.add({
										seqId: state.id,
										event: {
											timestamp: wsClient.now(),
											raw: data,
											kind: eventName as EventType,
											value: value || attack,
											note: note && note._number,
										},
									}),
								)
							},
							{ channels: allChannels },
						)
					}
					input.addListener(
						'noteon',
						(evt: MidiNoteEvent) => {
							const { data, target, timestamp } = evt
							// if (conn.readyState === WebSocket.OPEN) {
							// 	conn.send(JSON.stringify({ data, timestamp }))
							// } else {
							// 	console.warn('Not sending note, websocket is not open')
							// }
							// // const { attack, data, note, target } = evt
							const tickEvt = {
								seq: this.state,
								step: {
									id: -1,
									triggers: [
										{
											freq: data[1],
											unit: 'midi',
											dur: '16n',
										} as Trigger,
									],
								},
							}
							const off = Transport.now() - Transport.immediate()
							const plusAlt = Transport.getSecondsAtTime('+2n')
							const tgt = plusAlt - off
							console.warn({ off, plusAlt, tgt })
							// console.log('New note', now(), timestamp, target.number, evt.data, tickEvt)
							this.tick(Tone.immediate(), tickEvt)
							// Transport.schedule((time: number) => {
							// 	console.warn('Play note', time, target.number, evt.data, tickEvt)
							// 	this.tick(time, tickEvt)
							// }, tgt)
						},
						{ channels: allChannels },
					)
				}
			})
			.catch((err: Error) => console.error(err))
	}

	dispose() {
		this.sequencer.dispose()
		console.log('[EngineSequence #dispose] Disposed')
	}

	update(state: StateSequence) {
		if (this.state.steps !== state.steps) {
			// Steps updated, reset the sequencer events
			this.sequencer.events = tickEvents(state)
		}
		this.state = state
		// console.log('[EngineSequence #update] Updated', state)
	}

	connect(ref: StateSequenceOutput, to: EngineInstrument) {
		this.outputs[seqOutputKey(ref)] = to
		// console.log('[EngineSequence #connect] Connected', ref)
	}

	stop() {
		storeLocal.dispatch(
			apiSequences.currentStep.set({
				seqId: this.state.id,
				stepId: 0,
			}),
		)
	}

	warnOnce: boolean = false
	private tick = (time: number, tickEvt: TickEvent) => {
		const { seq, step } = tickEvt
		let someMissing = false
		for (const trig of step.triggers) {
			for (const oo of seq.outputs) {
				const output = this.outputs[seqOutputKey(oo)]
				if (!output) {
					if (!this.warnOnce) {
						console.warn('[EngineSequence #tick] Unable to find instrument for output', oo)
					}
					someMissing = true
					continue
				}
				output.trigger(time, oo.inputId, trig)
			}
		}
		this.warnOnce = this.warnOnce || someMissing

		// // Updating currentStep (for highlighting the step in the UI) is disabled
		// // because it was killing peformance
		// storeLocal.dispatch(
		// 	apiSequences.currentStep.set({
		// 		seqId: seq.id,
		// 		stepId: step.id,
		// 	}),
		// )
	}
}
