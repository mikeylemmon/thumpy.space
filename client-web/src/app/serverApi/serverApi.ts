import { MidiEvent } from '../MIDI'

// export const WS_URL = 'ws://localhost:38883'
// export const WS_URL = 'wss://mikeylemmon.com/api'
export const WS_URL = 'wss://thumpy.space/api'
export const WS_HEADER_END = '#'

//
// Client API
//
export const WS_CLIENT_ID = 'client/id'
export type ClientIdResp = { clientId: number }

export function parseClientId(body: string): number {
	const resp: ClientIdResp = JSON.parse(body)
	return resp.clientId
}

//
// Users API
//
export const WS_USERS_ALL = 'user/all'
export const WS_USER_UPDATE = 'user/update'
export const WS_USER_EVENT = 'user/event'
export const WS_USER_FORCE = 'user/force'
export const WS_USER_XFORM = 'user/xform'
export const WS_USER_REQUEST_XFORMS = 'user/request_xforms'

export type User = {
	clientId: number
	name: string
	instrument: string
	inputDevice: string
	offset: number
}

export type UserEvent = {
	clientId: number
	instrument: string
	midiEvent: MidiEvent
	timestamp: number
}

export type UserForce = {
	clientId: number
	force: number[]
}

export type UserXform = {
	clientId: number
	pos: number[]
	rot: number[]
	scale: number[]
	force: number[]
	vel: number[]
}

export function parseUsersAll(body: string): User[] {
	const resp: User[] = JSON.parse(body)
	return resp
}
export function parseUserEvent(body: string): UserEvent {
	const resp: UserEvent = JSON.parse(body)
	return resp
}
export function parseUserForce(body: string): UserForce {
	const resp: UserForce = JSON.parse(body)
	return resp
}
export function parseUserXform(body: string): UserXform {
	const resp: UserXform = JSON.parse(body)
	return resp
}

export function userUpdateReq(req: User): string {
	return WS_USER_UPDATE + WS_HEADER_END + JSON.stringify(req)
}
export function userEventReq(req: UserEvent): string {
	return WS_USER_EVENT + WS_HEADER_END + JSON.stringify(req)
}
export function userForceReq(req: UserForce): string {
	return WS_USER_FORCE + WS_HEADER_END + JSON.stringify(req)
}
export function userXformReq(req: UserXform): string {
	return WS_USER_XFORM + WS_HEADER_END + JSON.stringify(req)
}
export function userRequestXformsReq(): string {
	return WS_USER_REQUEST_XFORMS + WS_HEADER_END
}
