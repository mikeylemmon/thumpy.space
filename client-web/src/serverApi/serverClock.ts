import { WS_HEADER_END } from './serverApi'

export const WS_CLOCK_NOW = 'clock/now'
export const WS_CLOCK_ORIGIN = 'clock/origin'

export type ClockNowResp = { nowMs: number }
export type ClockOriginResp = { originMs: number }

export const clockNowReq = () => WS_CLOCK_NOW + WS_HEADER_END
