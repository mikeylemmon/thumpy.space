import { WS_HEADER_END } from './serverApi'

export const WS_CLOCK_NOW = 'clock/now'
export const WS_CLOCK_ORIGIN = 'clock/origin'
export const WS_CLOCK_UPDATE = 'clock/update'
export const NOTE_METRONOME_BPM_CHANGED = 32
export const NOTE_METRONOME_DOWN = 34
export const NOTE_METRONOME_UP = 35

export type ClockNowResp = { nowMs: number }
export type ClockOriginResp = { originMs: number }
export type ClockOpts = {
	bpm: number
	clientId?: number
}

export const clockNowReq = () => WS_CLOCK_NOW + WS_HEADER_END
export const clockUpdateReq = (clk: ClockOpts) => WS_CLOCK_UPDATE + WS_HEADER_END + JSON.stringify(clk)

export function parseClockUpdate(body: string): ClockOpts {
	const resp: ClockOpts = JSON.parse(body)
	return resp
}
