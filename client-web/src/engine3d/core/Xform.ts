import { Vec } from './Vec'

export class Xform {
	pos: Vec
	rot: Vec
	scale: Vec

	constructor(pos?: Vec, rot?: Vec, scale?: Vec) {
		this.pos = pos ? pos : new Vec()
		this.rot = rot ? rot : new Vec()
		this.scale = scale ? scale : new Vec(1.0)
	}

	applyTo = (vec: Vec) => {
		vec.applyMult(this.scale)
		// TODO: rotation
		vec.applyAdd(this.pos)
	}
}
