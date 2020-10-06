import { Vec3 } from 'cannon'

export class Vec extends Vec3 {
	// eslint-disable-next-line
	constructor(...vals: number[]) {
		super()
		this.apply(...vals)
	}

	clone = (): Vec => new Vec(this.x, this.y, this.z)
	cloneMult = (val: number | Vec) => this.clone().applyMult(val)
	cloneAdd = (val: number | Vec) => this.clone().applyAdd(val)

	isOne = () => this.x === 1 && this.y === 1 && this.z === 1

	apply = (...vals: number[]) => {
		this.x = vals.length > 0 ? vals[0] : 0
		this.y = vals.length > 1 ? vals[1] : this.x
		this.z = vals.length > 2 ? vals[2] : vals.length === 2 ? 0 : this.x
		return this
	}

	applyMult = (val: number | Vec) => {
		if (val instanceof Vec) {
			this.x *= val.x
			this.y *= val.y
			this.z *= val.z
			return this
		}
		this.x *= val
		this.y *= val
		this.z *= val
		return this
	}

	applyAdd = (val: number | Vec) => {
		if (val instanceof Vec) {
			this.x += val.x
			this.y += val.y
			this.z += val.z
			return this
		}
		this.x += val
		this.y += val
		this.z += val
		return this
	}
}
