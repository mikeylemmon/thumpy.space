export class Vec extends window.p5.Vector {
	constructor(...vals: number[]) {
		super()
		this.apply(...vals)
	}

	clone = (): Vec => new Vec(this.x, this.y, this.z)
	cloneMult = (val: number | Vec) => this.clone().applyMult(val)
	cloneAdd = (val: number | Vec) => this.clone().applyAdd(val)

	isZero = () => this.x === 0 && this.y === 0 && this.z === 0
	isOne = () => this.x === 1 && this.y === 1 && this.z === 1
	isEqual = (other: Vec) => this.x === other.x && this.y === other.y && this.z === other.z

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
