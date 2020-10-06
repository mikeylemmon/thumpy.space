import { Vec3 } from 'cannon'

export class Vec extends Vec3 {
	// eslint-disable-next-line
	constructor(...vals: number[]) {
		super()
		this._set(...vals)
	}
	clone = (): Vec => new Vec(this.x, this.y, this.z)
	// toArray = () => [this.x, this.y, this.z]
	// isZero = () => this.x === 0 && this.y === 0 && this.z === 0
	isOne = () => this.x === 1 && this.y === 1 && this.z === 1
	_set = (...vals: number[]) => {
		this.x = vals.length > 0 ? vals[0] : 0
		this.y = vals.length > 1 ? vals[1] : this.x
		this.z = vals.length > 2 ? vals[2] : vals.length === 2 ? 0 : this.x
	}
	_mult = (val: number | Vec) => {
		if (val instanceof Vec) {
			this.x *= val.x
			this.y *= val.y
			this.z *= val.z
			return
		}
		this.x *= val
		this.y *= val
		this.z *= val
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
	applyTo = (vec: Vec) => {
		vec._mult(this.scale)
		// TODO: rotation
		vec.vadd(this.pos)
	}
}
