import { StateSequence } from 'storeShared/sliceSequences'
import { StateInstrument } from 'storeShared/sliceInstruments'
import { EngineInstrument, EngineInstrumentStatic, EngineInstrumentTypeList } from './EngineInstrument'
import { EngineSequencer } from './EngineSequencer'
import DrumMachine from './audio/instruments/DrumMachine'

class Engine {
	static Instruments: EngineInstrumentStatic[] = [DrumMachine]
	private sequencers: { [key: string]: EngineSequencer } = {}
	private instruments: { [key: string]: EngineInstrument } = {}

	static InstrumentTypes(): EngineInstrumentTypeList {
		const list: EngineInstrumentTypeList = []
		for (let ii = 0; ii < this.Instruments.length; ii++) {
			const kind = this.Instruments[ii]
			list.push({
				index: ii,
				displayName: kind.DisplayName,
			})
		}
		return list
	}

	constructor() {
		// this.audio = new EngineAudio()
		console.log('[engine] instruments:', ...Engine.InstrumentTypes())
	}

	dispose() {
		for (const key in this.instruments) {
			this.instruments[key].dispose()
		}
		for (const key in this.sequencers) {
			this.sequencers[key].dispose()
		}
	}

	updateInstrument(inst: StateInstrument) {
		if (!this.instruments[inst.id]) {
			const Inst = Engine.Instruments.find(ii => ii.TypeId === inst.typeId)
			if (!Inst) {
				console.log(
					'[Engine #updateInstrument] Unable to find instrument type with TypeId',
					inst.typeId,
				)
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
			this.sequencers[seq.id] = new EngineSequencer(seq)
		}
		const engSeq = this.sequencers[seq.id]
		for (const seqOut of seq.outputs) {
			// TODO: Only update output connects when they change
			const engInst = this.instruments[seqOut.instrumentId]
			if (!engInst) {
				console.error(
					'[Engine #updateSequence] Unable to find instrument for sequence output',
					seqOut,
				)
				continue
			}
			engSeq.connect(seqOut, engInst)
		}
		engSeq.update(seq)
	}
}

export default Engine
