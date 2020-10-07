import * as p5 from 'p5'
import { Vec } from './Vec'
import { Xform } from './Xform'
import { Component } from './Component'
import { engine3d } from './engine3d'

export type drawFunc = (pg: p5.Graphics) => void
export type drawFunc2D = (pp: p5, pos: p5.Vector) => void

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

	draw = (pg: p5.Graphics) => {
		pg.push()
		this.applyXformToGraphics(pg)
		if (this.drawFunc) {
			this.drawFunc(pg)
		}
		pg.pop()
	}

	draw2D = (pp: p5, pg: p5.Graphics) => {
		if (!this.drawFunc2D) {
			return
		}
		const gg = pg as any
		const mvp = gg._renderer.uMVMatrix.copy().mult(gg._renderer.uPMatrix)
		const ndcPos = multMatrixVector(pp, mvp, this.xform.pos)
		ndcPos.x += pp.width / 2
		ndcPos.y += pp.height / 2
		pp.push()
		// pp.translate(ndcPos.x, ndcPos.y)
		this.drawFunc2D(pp, ndcPos)
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

/* Multiply a 4x4 homogeneous matrix by a Vector4 considered as point
 * (ie, subject to translation).
 * [via https://github.com/processing/p5.js/issues/1553]
 */
function multMatrixVector(pp: p5, m: any, v: Vec) {
	const _dest = pp.createVector()
	const mat = m.mat4

	// Multiply in column major order.
	_dest.x = mat[0] * v.x + mat[4] * v.y + mat[8] * v.z + mat[12]
	_dest.y = mat[1] * v.x + mat[5] * v.y + mat[9] * v.z + mat[13]
	_dest.z = mat[2] * v.x + mat[6] * v.y + mat[10] * v.z + mat[14]
	const w = mat[3] * v.x + mat[7] * v.y + mat[11] * v.z + mat[15]

	if (Math.abs(w) > Number.EPSILON) {
		_dest.mult(1.0 / w)
	}

	return _dest
}
