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
		if (opts.debug) {
			this.debug = true
		}
	}

	addObj = (obj: Obj) => this.objs.unshift(obj)
	rmObj = (obj: Obj, destroy = true) => {
		this.objs = this.objs.filter(oo => {
			if (oo === obj) {
				if (destroy) {
					oo.destroy()
				}
				return false
			}
			return true
		})
	}
	getObjs = (objType: any) => this.objs.filter(oo => oo instanceof objType)
	getObj = (objType: any): Obj | undefined => {
		for (const oo of this.objs) {
			if (oo instanceof objType) {
				return oo
			}
		}
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
			obj.drawShadow(pg)
			if (this.debug) {
				obj.drawDebug(pg)
			}
		}
	}

	draw2D = (pp: p5, pg: p5.Graphics) => {
		const gg = pg as any
		const mvp = gg._renderer.uMVMatrix.copy().mult(gg._renderer.uPMatrix)
		for (const obj of this.objs) {
			obj.draw2D(pp, pg, mvp.mat4)
		}
	}
}

export const engine3d = new Engine3D({ debug: false })
