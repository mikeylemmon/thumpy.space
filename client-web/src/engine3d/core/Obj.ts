import * as p5 from 'p5'
import { Vec } from './Vec'
import { Xform } from './Xform'
import { Component } from './Component'
import { engine3d } from './engine3d'

export type drawFunc = (pg: p5.Graphics) => void
export type drawFunc2D = (pp: p5, pos: Vec, scale: number) => void

export type ObjOpts = {
	parent?: Obj
	children?: Obj[]
	comps?: Component[]
	pos?: Vec
	rot?: Vec
	scale?: Vec
	draw?: drawFunc
	drawShadow?: drawFunc
	draw2D?: drawFunc2D
}

export class Obj {
	children: Obj[] = []
	comps: Component[] = []
	xform: Xform = new Xform()
	parent?: Obj
	drawFunc?: drawFunc
	drawShadowFunc?: drawFunc
	drawFunc2D?: drawFunc2D

	constructor(opts: ObjOpts = {}) {
		// console.log('[Obj] ctor', this)
		this.drawFunc = opts.draw
		this.drawFunc2D = opts.draw2D
		this.parent = opts.parent
		if (opts.children) {
			this.children = opts.children
		}
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
		this.children.forEach(cc => cc.destroy())
		// console.log('[Obj] destroyed')
	}
	rm = () => {
		if (this.parent) {
			this.parent.rmChild(this)
		} else {
			engine3d.rmObj(this)
		}
	}

	addChild = (obj: Obj) => {
		engine3d.rmObj(obj, false) // remove Obj from root hierarchy
		this.children.push(obj)
	}
	rmChild = (obj: Obj) => {
		this.children = this.children.filter(cc => {
			if (cc === obj) {
				cc.destroy()
				return false
			}
			return true
		})
	}
	getChildren = (objType: any) => this.children.filter(oo => oo instanceof objType)
	getChild = (objType: any): Obj | undefined => this.getChildren(objType)[0]

	addComp = (comp: Component) => {
		this.comps.push(comp)
	}
	rmComp = (comp: Component) => {
		this.comps = this.comps.filter(cc => {
			if (cc === comp) {
				cc.destroy()
				return false
			}
			return true
		})
	}
	getComps = (compType: any) => this.comps.filter(cc => cc instanceof compType)
	getComp = (compType: any): Component | undefined => this.getComps(compType)[0]

	update(dt: number) {
		this.comps.forEach(cc => cc.update(dt))
		this.children.forEach(cc => cc.update(dt))
	}

	draw(pg: p5.Graphics) {
		pg.push()
		this.applyXformToGraphics(pg)
		if (this.drawFunc) {
			this.drawFunc(pg)
		}
		this.children.forEach(cc => cc.draw(pg))
		pg.pop()
	}

	drawShadow(pg: p5.Graphics) {
		// Similar to draw, but xformed to ground plane
		pg.push()
		const { pos, rot, scale } = this.xform
		pg.translate(pos.x, 0, pos.z)
		if (rot.y !== 0) pg.rotateY(rot.y)
		pg.scale(scale.x, 1, scale.z)
		if (this.drawShadowFunc) {
			this.drawShadowFunc(pg)
		}
		this.children.forEach(cc => cc.drawShadow(pg))
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
			ndc.x = ((ndc.x + 1) * pp.width) / 2
			ndc.y = ((1 - ndc.y) * pp.height) / 2
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
		this.children.forEach(cc => cc.draw2D(pp, pg, mvp))
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
