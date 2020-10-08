import * as p5 from 'p5'
import { Vec } from './Vec'
import { Xform } from './Xform'
import { Component } from './Component'
import { engine3d } from './engine3d'

export type drawFunc = (pg: p5.Graphics) => void
export type drawFunc2D = (pp: p5, pos: Vec, scale: number) => void

export type ObjOpts = {
	comps?: Component[]
	pos?: Vec
	rot?: Vec
	scale?: Vec
	draw?: drawFunc
	draw2D?: drawFunc2D
}

export class Obj {
	comps: Component[] = []
	xform: Xform = new Xform()
	drawFunc?: drawFunc
	drawFunc2D?: drawFunc2D

	constructor(opts: ObjOpts) {
		console.log('[Obj] ctor', this)
		this.drawFunc = opts.draw
		this.drawFunc2D = opts.draw2D
		if (opts.comps) {
			this.comps = opts.comps
		}
		if (opts.pos) {
			this.xform.pos = opts.pos
		}
		if (opts.rot) {
			this.xform.rot = opts.rot
		}
		if (opts.scale) {
			this.xform.scale = opts.scale
		}
		engine3d.addObj(this)
	}

	destroy = () => {
		this.comps.forEach(cc => cc.destroy())
		console.log('[Obj] destroyed')
	}
	rm = () => {
		engine3d.rmObj(this)
	}

	addComp = (comp: Component) => {
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

	update(dt: number) {
		this.comps.forEach(cc => cc.update(dt))
	}

	draw(pg: p5.Graphics) {
		pg.push()
		this.applyXformToGraphics(pg)
		if (this.drawFunc) {
			this.drawFunc(pg)
		}
		pg.pop()
	}

	draw2D(pp: p5, pg: p5.Graphics, mvp: number[]) {
		if (!this.drawFunc2D) {
			return
		}
		const { pos, scale } = this.xform
		const ndcPos = pos.cloneMultMat(mvp)
		const edge = 1.2
		if (ndcPos.w < 0 || ndcPos.x < -edge || ndcPos.x > edge || ndcPos.y < -edge || ndcPos.y > edge) {
			// object is off-screen
			return
		}
		// calculate a rough-guess at screen-space scale
		// (would use inverse MVP matrix but I can't get p5's matrix invert method to work)
		const ndcPos2 = pos.cloneAdd(scale).cloneMultMat(mvp)
		const ndcPos3 = pos.cloneAdd(scale.cloneMult(new Vec(1, -1, -1))).cloneMultMat(mvp)
		const ndcPos4 = pos.cloneAdd(scale.cloneMult(new Vec(-1, -1, 1))).cloneMultMat(mvp)
		for (const ndc of [ndcPos, ndcPos2, ndcPos3, ndcPos4]) {
			ndc.x = (ndc.x + 1) * pp.width / 2
			ndc.y = (1 - ndc.y) * pp.height / 2
			ndc.z = 0
		}
		const scale2d = Math.max(
			ndcPos.cloneSub(ndcPos2).mag(),
			ndcPos.cloneSub(ndcPos3).mag(),
			ndcPos.cloneSub(ndcPos4).mag(),
		)
		pp.push()
		this.drawFunc2D(pp, ndcPos, scale2d)
		pp.pop()
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
