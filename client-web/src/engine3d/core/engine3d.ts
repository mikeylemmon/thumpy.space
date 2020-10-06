import * as p5 from 'p5'
import { Obj } from './Obj'

export type Engine3DOpts = {
	debug?: boolean
}

export class Engine3D {
	objs: Obj[] = []
	debug = false
	lastUpdate?: number

	constructor(opts: Engine3DOpts = {}) {
		if (opts.debug) { this.debug = true }
	}

	addObj = (obj: Obj) => this.objs.push(obj)
	rmObj = (obj: Obj) => {
		this.objs = this.objs.filter(oo => {
			if (oo === obj) {
				oo.destroy()
				return false
			}
			return true
		})
	}

	update = () => {
		if (!this.lastUpdate) {
			this.lastUpdate = new Date().valueOf()
			return
		}
		const now = new Date().valueOf()
		const dt = (now - this.lastUpdate) / 1000
		this.lastUpdate = now
		this.objs.forEach(oo => oo.update(dt))
	}

	draw = (pg: p5.Graphics) => {
		for (const obj of this.objs) {
			obj.draw(pg)
			if (this.debug) {
				obj.drawDebug(pg)
			}
		}
	}
}

export const engine3d = new Engine3D({ debug: true })
