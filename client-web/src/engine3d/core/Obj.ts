import * as p5 from 'p5'
import { Vec } from './Vec'
import { Xform } from './Xform'
import { Component } from './Component'
import { engine3d } from './engine3d'

export type drawFunc = (pg: p5.Graphics) => void

export type ObjOpts = {
	comps?: Component[]
	pos?: Vec
	rot?: Vec
	scale?: Vec
	draw?: drawFunc
}

export class Obj {
	comps: Component[] = []
	xform: Xform = new Xform()
	drawFunc?: drawFunc

	constructor(opts: ObjOpts) {
		console.log('[Obj] ctor', this)
		this.drawFunc = opts.draw
		if (opts.comps) { this.comps = opts.comps }
		if (opts.pos) { this.xform.pos = opts.pos }
		if (opts.rot) { this.xform.rot = opts.rot }
		if (opts.scale) { this.xform.scale = opts.scale }
		engine3d.addObj(this)
	}
	destroy = () => {
		this.comps.forEach(cc => cc.destroy())
		console.log('[Obj] destroyed')
	}
	rm = () => {
		engine3d.rmObj(this)
	}

	addComponent = (comp: Component) => {
		this.comps.push(comp)
	}
	rmComponent = (comp: Component) => {
		this.comps = this.comps.filter(cc => {
			if (cc === comp) {
				cc.destroy()
				return false
			}
			return true
		})
	}
	getComps = (compType: any) => this.comps.filter(cc => cc instanceof compType)
	getComp = (compType: any): Component | null => {
		const cs = this.getComps(compType)
		if (cs.length) {
			return cs[0]
		}
		return null
	}

	update = (dt: number) => {
		this.comps.forEach(cc => cc.update(dt))
	}

	draw = (pg: p5.Graphics) => {
		pg.push()
		this.applyXformToGraphics(pg)
		if (this.drawFunc) {
			this.drawFunc(pg)
		}
		pg.pop()
	}

	drawDebug = (pg: p5.Graphics) => {
		this.comps.forEach(cc => cc.drawDebug && cc.drawDebug(pg))
	}

	applyXformToGraphics = (pg: p5.Graphics) => {
		const { pos, rot, scale } = this.xform
		if (!pos.isZero()) {
			pg.translate(pos.x, pos.y, pos.z)
		}
		if (rot.z !== 0) pg.rotateZ(rot.z)
		if (rot.y !== 0) pg.rotateY(rot.y)
		if (rot.x !== 0) pg.rotateX(rot.x)
		if (!scale.isOne()) {
			pg.scale(scale.x, scale.y, scale.z)
		}
	}
}
