import { Transport } from 'tone'
import { StateSequence } from 'storeShared/sliceSequences'
import { StateInstrument } from 'storeShared/sliceInstruments'
import { EngineInstrument, EngineInstrumentStatic, EngineInstrumentTypeList } from './EngineInstrument'
import { EngineSequence } from './EngineSequence'

const instrumentTypes: EngineInstrumentStatic[] = []

export function registerInstrumentType(instType: EngineInstrumentStatic) {
	instrumentTypes.push(instType)
}

export class Engine {
	static InstrumentTypes(): EngineInstrumentTypeList {
		const list: EngineInstrumentTypeList = []
		for (let ii = 0; ii < instrumentTypes.length; ii++) {
			const kind = instrumentTypes[ii]
			list.push({
				index: ii,
				displayName: kind.DisplayName,
			})
		}
		return list
	}

	private isAudioPlayer: boolean = false
	private sequencers: { [key: string]: EngineSequence } = {}
	private instruments: { [key: string]: EngineInstrument } = {}
	private instrumentsDisabled: { [key: string]: boolean } = {}

	constructor() {
		console.log('[engine #constructor] instruments:', ...Engine.InstrumentTypes())
	}

	dispose() {
		for (const key in this.instruments) {
			this.instruments[key].dispose()
		}
		for (const key in this.sequencers) {
			this.sequencers[key].dispose()
		}
	}

	instrumentById(instId: string): EngineInstrument {
		return this.instruments[instId]
	}

	updateIsAudioPlayer(isAudioPlayer: boolean) {
		// // TODO:
		// if (!isAudioPlayer && this.isAudioPlayer) {
		// 	// Audio turned off, disconnect and remove audio instruments
		// }
		this.isAudioPlayer = isAudioPlayer
		console.log('[Engine #updateIsAudioPlayer]', isAudioPlayer)
	}

	updatePaused(paused: boolean) {
		console.log('[Engine #updatePaused]', paused ? 'stop' : 'start')
		if (paused) {
			Transport.stop()
			for (const seqId in this.sequencers) {
				this.sequencers[seqId].stop()
			}
		} else {
			// FIXME: This causes weirdness (mutliple play-points) when a new window is
			// opened while the transport is already playing in another window. A
			// current workaround is implemented in InstrumentView by dispatching a
			// pause action when opening a new window
			Transport.start()
		}
	}

	updateInstrument(inst: StateInstrument) {
		if (!this.instruments[inst.id]) {
			const Inst = instrumentTypes.find(ii => ii.TypeId === inst.typeId)
			if (!Inst) {
				console.log(
					'[Engine #updateInstrument] Unable to find instrument type with TypeId',
					inst.typeId,
				)
				return
			}
			if (Inst.Subengine === 'audio' && !this.isAudioPlayer) {
				console.log('[Engine #updateInstrument] Skipping audio instrument', inst.id)
				this.instrumentsDisabled[inst.id] = true
				return
			}
			this.instruments[inst.id] = new Inst(inst)
			console.log('[Engine #updateInstrument] Created new instrument', this.instruments[inst.id])
		}
		this.instruments[inst.id].updateState(inst)
		console.log('[Engine #updateInstrument] Updated instrument', this.instruments[inst.id])
	}

	updateSequence(seq: StateSequence) {
		if (!this.sequencers[seq.id]) {
			this.sequencers[seq.id] = new EngineSequence(seq)
		}
		const engSeq = this.sequencers[seq.id]
		// TODO: Create map of outputs and provide to update call, remove connect call
		for (const seqOut of seq.outputs) {
			if (this.instrumentsDisabled[seqOut.instrumentId]) {
				continue // skip disabled instruments
			}
			const engInst = this.instruments[seqOut.instrumentId]
			if (!engInst) {
				console.warn('[Engine #updateSequence] Unable to find instrument for sequence output', seqOut)
				continue
			}
			engSeq.connect(seqOut, engInst)
		}
		engSeq.update(seq)
	}
}

const engine = new Engine()
export default engine
