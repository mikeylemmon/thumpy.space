import {
	parseClientId,
	parseUsersAll,
	parseUserEvent,
	parseUserForce,
	parseUserXform,
	User,
	UserEvent,
	UserForce,
	UserXform,
	WS_CLIENT_ID,
	WS_HEADER_END,
	WS_URL,
	WS_USERS_ALL,
	WS_USER_EVENT,
	WS_USER_FORCE,
	WS_USER_XFORM,
	WS_USER_REQUEST_XFORMS,
} from './serverApi'
import { parseClockUpdate, ClockOpts, WS_CLOCK_NOW, WS_CLOCK_ORIGIN, WS_CLOCK_UPDATE } from './serverClock'
import WSClock, { WSClockOptions } from './WSClock'

export const DONT_REOPEN = 888

export type WSClientOptions = {
	clock: Partial<WSClockOptions>
	onClientId: (clientId: number) => any
	onClockUpdate: (clkOpts: ClockOpts) => void
	onUsers: (users: User[]) => void
	onUserEvent: (evt: UserEvent) => void
	onUserForce: (evt: UserForce) => void
	onUserXform: (evt: UserXform) => void
	onUserRequestXforms: () => void
}

export default class WSClient {
	conn: WebSocket
	clock: WSClock
	global: any
	options: WSClientOptions
	clientId: number = 0
	users: User[] = []

	constructor(global: any, options: WSClientOptions) {
		this.global = global
		this.options = options as WSClientOptions
		this.conn = this.newConn()
		this.clock = new WSClock(this.global, this.conn, this.options.clock)
	}

	reopen = () => {
		// Try to re-open the websocket connection if it has closed
		if (this.conn.readyState !== WebSocket.CLOSED) {
			return
		}
		this.conn = this.newConn()
	}

	ready = () => this.conn && this.conn.readyState === WebSocket.OPEN

	newConn = (): WebSocket => {
		const conn = new WebSocket(WS_URL)
		conn.onclose = (evt: CloseEvent) => {
			if (evt.code === DONT_REOPEN) {
				console.warn('Closing for good', evt)
				return
			}
			console.warn('WebSocket closed, will attempt to reopen in a few seconds', evt)
			setTimeout(this.reopen, 5000)
		}
		conn.onopen = (evt: Event) => {
			console.log('WebSocket opened', evt)
			this.clock.destroy()
			this.clock = new WSClock(this.global, this.conn, this.options.clock)
		}
		conn.onerror = (evt: Event) => {
			console.error('WebSocket error', evt)
		}
		conn.onmessage = this.onMessage
		return conn
	}

	onMessage = (evt: MessageEvent) => {
		const parts = split(evt.data, WS_HEADER_END, 1)
		const [head, body] = parts
		switch (head) {
			case WS_CLOCK_NOW:
			case WS_CLOCK_ORIGIN:
				if (!this.clock) {
					console.error('[WSClient #onMessage] No local clock ready to handle server clock message')
					return
				}
				if (head === WS_CLOCK_ORIGIN) {
					this.clock.onClockOrigin(body)
				} else {
					this.clock.onClockNow(body)
				}
				break
			case WS_CLOCK_UPDATE:
				const clkOpts = parseClockUpdate(body)
				this.options.onClockUpdate(clkOpts)
				console.log('[WSClient #onMessage] Received clockUpdate', clkOpts)
				break
			case WS_CLIENT_ID:
				this.clientId = parseClientId(body)
				console.log('[WSClient #onMessage] Received clientId', this.clientId)
				this.options.onClientId(this.clientId)
				break
			case WS_USERS_ALL:
				this.users = parseUsersAll(body).filter(uu => !!uu)
				// console.log('[WSClient #onMessage] Received users', this.users)
				this.options.onUsers(this.users)
				break
			case WS_USER_EVENT: {
				const uevt = parseUserEvent(body)
				// console.log('[WSClient #onMessage] Received user event', uevt)
				this.options.onUserEvent(uevt)
				break
			}
			case WS_USER_FORCE: {
				const uevt = parseUserForce(body)
				// console.log('[WSClient #onMessage] Received user event', uevt)
				this.options.onUserForce(uevt)
				break
			}
			case WS_USER_XFORM: {
				const uevt = parseUserXform(body)
				// console.log('[WSClient #onMessage] Received user event', uevt)
				this.options.onUserXform(uevt)
				break
			}
			case WS_USER_REQUEST_XFORMS: {
				console.log('[WSClient #onMessage] Received Xform request')
				this.options.onUserRequestXforms()
				break
			}
			default:
				console.log('[WSClient #onMessage] Unhandled message', { head, body, parts }, evt)
				break
		}
	}

	now = (): number => {
		if (!this.clock) {
			console.error('[WSClient #now] No clock!')
			return -1
		}
		return this.clock.now()
	}

	getUser = (clientId: number) => {
		for (const uu of this.users) {
			if (uu.clientId === clientId) {
				return uu
			}
		}
	}
}

// split function with remainder
// via https://stackoverflow.com/questions/874709/converting-user-input-string-to-regular-expression
function split(str: string, sep: string, nn: number) {
	const out: string[] = []
	const sepRe = new RegExp(sep, 'g')
	while (nn--) {
		const prevIndex = sepRe.lastIndex
		const re = sepRe.exec(str)
		if (!re) {
			break
		}
		out.push(str.slice(prevIndex, re.index))
	}
	out.push(str.slice(sepRe.lastIndex))
	return out
}
