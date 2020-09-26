import { clockNowReq, ClockNowResp, ClockOriginResp } from './serverClock'

const SYNC_PERIOD_INITIAL_MS = 500,
	SYNC_INITIAL_NUM = 6, // number of times to use initial period
	SYNC_PERIOD_MS = 2000

export type WSClockOptions = {
	onSynced: () => void
}

export default class WSClock {
	global: any
	conn: WebSocket
	localOrigin: number
	correction = 0 // a correction to apply to the local clock based on rolling-average deviation from server clock
	precision = 0 // average of how accurate the workerClock is with correction applied
	correction2 = 0 // a derivative correction that accounts for linear clock deviation (i.e. local clock is X slower/faster than server)
	precision2 = 0 // measures how accurate the workerClock is with correction and correction2 applied
	lowpass = 0.3 // how much latest sample affects correction/precision
	lastReqAt = 0
	lastRespAt = 0
	loopId = -1
	syncInitial = 0
	serverOrigin = 0
	precisionNow = 0
	syncPeriod = SYNC_PERIOD_INITIAL_MS
	synced = false
	options: Partial<WSClockOptions>

	constructor(global: any, conn: WebSocket, options: Partial<WSClockOptions> = {}) {
		this.global = global
		this.options = options
		// this.localOrigin = global.performance.timing.navigationStart
		this.localOrigin = global.performance.timeOrigin
		this.conn = conn
		this.loopId = global.setInterval(this.update, this.syncPeriod)
	}

	nowRaw() {
		return global.performance.now()
	}

	update = () => {
		if (this.conn.readyState !== WebSocket.OPEN) {
			this.global.clearTimeout(this.loopId)
			return
		}
		this.lastReqAt = this.nowRaw()
		this.conn.send(clockNowReq())
	}

	onClockOrigin(body: string) {
		const resp: ClockOriginResp = JSON.parse(body)
		const { originMs } = resp
		if (!originMs) {
			console.error('[workerClock #onClockOrigin] Received empty response')
			return
		}
		this.serverOrigin = originMs
	}

	onClockNow(body: string) {
		const resp: ClockNowResp = JSON.parse(body)
		const { nowMs } = resp || {}
		if (!nowMs) {
			console.error('[workerClock #onClockNow] Received empty response')
			return
		}
		this.lastRespAt = this.nowRaw()
		const dur = this.lastRespAt - this.lastReqAt
		const mid = dur / 2 + this.lastReqAt
		const delta = nowMs - mid
		if (this.correction === 0) {
			this.correction = delta
		} else {
			this.correction = delta * this.lowpass + this.correction * (1 - this.lowpass)
		}
		const precision = delta - this.correction
		if (this.precision === 0) {
			this.precision = precision
		} else {
			this.precision = precision * this.lowpass + this.precision * (1 - this.lowpass)
		}
		// Calculate a secondary correction based on the average value of precision to account
		// for the local clock being consistently slower/faster than the server clock
		this.correction2 = this.precision * this.lowpass + this.correction2 * (1 - this.lowpass)
		const precision2 = delta - this.correction - this.correction2
		if (this.precision2 === 0) {
			this.precision2 = precision2
		} else {
			this.precision2 = precision2 * this.lowpass + this.precision2 * (1 - this.lowpass)
		}

		// Calculate precision metrics for corrected "now" time
		const now = this.now() - dur / 2
		const deltaNow = now - nowMs
		this.precisionNow = deltaNow * this.lowpass + this.precisionNow * (1 - this.lowpass)

		// console.log(
		// 	'[workerClock #onClockNow]',
		// 	{
		// 		p: this.precision,
		// 		p2: this.precision2,
		// 		c: this.correction,
		// 		c2: this.correction2,
		// 	},
		// 	{
		// 		lastP: precision,
		// 		lastP2: precision2,
		// 		dur,
		// 	},
		// 	{
		// 		now: now,
		// 		nowMs: nowMs,
		// 		d: deltaNow,
		// 		pnow: this.precisionNow,
		// 	},
		// 	{
		// 		nowOverP: this.precisionNow / this.precision2,
		// 	},
		// )

		if (!this.synced && this.syncInitial++ > SYNC_INITIAL_NUM) {
			// Replace sync loop with lower-frequency interval
			this.synced = true
			this.global.clearTimeout(this.loopId)
			// this.correction2 *= SYNC_PERIOD_MS / SYNC_PERIOD_INITIAL_MS
			this.correction += this.correction2
			this.syncPeriod = SYNC_PERIOD_MS
			this.loopId = this.global.setInterval(this.update, this.syncPeriod)
			if (this.options.onSynced) {
				this.options.onSynced()
			}
		}
	}

	now() {
		const nn = this.nowRaw()
		const c2gain = 1 + (nn - this.lastRespAt) / this.syncPeriod
		return nn + this.correction + this.correction2 * c2gain
	}

	toGlobal(perfTime: number) {
		return perfTime + this.correction + this.correction2
	}

	toLocal(globalTime: number) {
		return globalTime - this.correction - this.correction2
	}
}
