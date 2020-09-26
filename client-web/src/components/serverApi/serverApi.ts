export const WS_URL = 'ws://localhost:38883'
export const WS_HEADER_END = '#'

export const WS_CLIENT_ID = 'client/id'
export type ClientIdResp = { clientId: number }

export function parseClientId(body: string): number {
	const resp: ClientIdResp = JSON.parse(body)
	return resp.clientId
}

export type User = {
	name: string
	instrument: string
	input: string
}

export const WS_USER_UPDATE = 'user/update'
export const WS_USERS_ALL = 'user/all'

export function parseUsersAll(body: string): User[] {
	const resp: User[] = JSON.parse(body)
	return resp
}

export function userUpdateReq(user: User): string {
	return WS_USER_UPDATE + WS_HEADER_END + JSON.stringify(user)
}
