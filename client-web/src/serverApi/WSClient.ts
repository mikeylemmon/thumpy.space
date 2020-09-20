import { WS_HEADER_END, WS_URL } from 'serverApi/serverApi'
import { WS_CLOCK_NOW, WS_CLOCK_ORIGIN } from 'serverApi/serverClock'
import WSClock, { WSClockOptions } from './WSClock'

export type WSClientOptions = {
	clock: Partial<WSClockOptions>
}

export default class WSClient {
	conn: WebSocket
	clock: WSClock
	global: any
	options: WSClientOptions

	constructor(global: any, options: Partial<WSClientOptions> = {}) {
		this.global = global
		this.options = options as WSClientOptions
		this.conn = this.newConn()
		this.clock = new WSClock(this.global, this.conn, this.options.clock)
		setInterval(this.reopen, 5000)
	}

	reopen = () => {
		// Try to re-open the websocket connection if it has closed
		if (this.conn.readyState !== WebSocket.CLOSED) {
			return
		}
		this.conn = this.newConn()
		this.clock = new WSClock(this.global, this.conn, this.options.clock)
	}

	newConn = (): WebSocket => {
		const conn = new WebSocket(WS_URL)
		conn.onclose = (evt: CloseEvent) => {
			console.warn('WebSocket closed', evt)
		}
		conn.onopen = (evt: Event) => {
			console.warn('WebSocket opened', evt)
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
					console.error(
						'[WorkerWSClient #onMessage] No local clock ready to handle server clock message',
					)
					return
				}
				if (head === WS_CLOCK_ORIGIN) {
					this.clock.onClockOrigin(body)
				} else {
					this.clock.onClockNow(body)
				}
				break
			default:
				console.log('[WorkerWSClient #onMessage] Unhandled message', { head, body, parts }, evt)
				break
		}
	}

	now = (): number => {
		if (!this.clock) {
			return -1
		}
		return this.clock.now()
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
