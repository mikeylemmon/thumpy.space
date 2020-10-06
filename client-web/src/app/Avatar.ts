import * as p5 from 'p5'

class Engine3D {
	gravity = 9.81
	objs: Obj[] = []
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
		this.objs.forEach(oo => oo.update())
	}
	draw = (pg: p5.Graphics) => {
		this.objs.forEach(oo => oo.draw(pg))
	}
}

export const engine3d = new Engine3D()

type drawFunc = (pg: p5.Graphics) => void

export class Vec {
	x = 0
	y = 0
	z = 0
	// eslint-disable-next-line // ignore erroneous ineffectual constructor warning
	constructor(...vals: number[]) {
		this.set(...vals)
	}
	toArray = () => [this.x, this.y, this.z]
	isZero = () => this.x === 0 && this.y === 0 && this.z === 0
	isOne = () => this.x === 1 && this.y === 1 && this.z === 1
	set = (...vals: number[]) => {
		this.x = vals.length > 0 ? vals[0] : 0
		this.y = vals.length > 1 ? vals[1] : this.x
		this.z = vals.length > 2 ? vals[2] : this.x
	}
}

export class Xform {
	pos: Vec
	rot: Vec
	scale: Vec
	constructor(pos?: Vec, rot?: Vec, scale?: Vec) {
		this.pos = pos ? pos : new Vec()
		this.rot = rot ? rot : new Vec()
		this.scale = scale ? scale : new Vec(1.0)
	}
}

type ObjOpts = {
	comps?: Component[]
	pos?: Vec
	rot?: Vec
	scale?: Vec
	draw?: drawFunc
}

class Obj {
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
	update = () => {
		this.comps.forEach(cc => cc.update())
	}
	draw = (pg: p5.Graphics) => {
		const { pos, rot, scale } = this.xform
		const posArr = pos.toArray(),
			scaleArr = scale.toArray()
		pg.push()
		if (!pos.isZero()) {
			pg.translate(posArr[0], -posArr[1], posArr[2])
		}
		if (rot.x !== 0) pg.rotateX(rot.x)
		if (rot.y !== 0) pg.rotateY(rot.y)
		if (rot.z !== 0) pg.rotateZ(rot.z)
		if (!scale.isOne()) {
			pg.scale(scaleArr[0], scaleArr[1], scaleArr[2])
		}
		if (this.drawFunc) {
			this.drawFunc(pg)
		}
		pg.pop()
	}
}

class Component {
	parent: Obj
	constructor(parent: Obj) {
		this.parent = parent
		console.log('[Component] ctor', this)
	}
	destroy = () => {
		console.log('[Component] destroyed')
	}
	update = () => {
		console.warn('[Component] update')
	}
}

class Bounds {
	min = new Vec(-0.5)
	max = new Vec(0.5)
	constructor(min?: Vec, max?: Vec) {
		if (min) { this.min = min }
		if (max) { this.max = max }
	}
	// world = (): Bounds => {
	// 	return new Bounds(
	// 		this.min
	// 	)
	// }
}

class Collidable extends Component {
	bounds = new Bounds()
	update = () => {
		console.log('[Collidable] update')
	}
}

class PhysObj extends Collidable {
	accel = new Vec()
	vel = new Vec()
	density = 1

	constructor(parent: Obj) {
		super(parent)
	}

	update = () => {
		// console.log('[PhysObj] update')
	}
}

export class Avatar extends Obj {
	constructor(opts: ObjOpts) {
		super(opts)
		this.comps = [
			new PhysObj(this),
		]
		console.log('[Avatar] ctor', this)
	}
}
