export class Vec extends window.p5.Vector {
	constructor(...vals: number[]) {
		super()
		this.setFromArray(vals)
	}

	clone = (): Vec => new Vec(this.x, this.y, this.z)
	cloneMult = (val: number | Vec) => this.clone().applyMult(val)
	cloneAdd = (val: number | Vec) => this.clone().applyAdd(val)
	cloneSub = (val: number | Vec) => this.clone().applySub(val)

	isZero = () => this.x === 0 && this.y === 0 && this.z === 0
	isOne = () => this.x === 1 && this.y === 1 && this.z === 1
	isEqual = (other: Vec) => this.x === other.x && this.y === other.y && this.z === other.z
	normalize = () => this.applyMult(1.0/this.mag())

	toArray = () => [this.x, this.y, this.z]
	setFromArray = (vals: number[]) => {
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

	applySub = (val: number | Vec) => {
		if (val instanceof Vec) {
			this.x -= val.x
			this.y -= val.y
			this.z -= val.z
			return this
		}
		this.x -= val
		this.y -= val
		this.z -= val
		return this
	}

	cloneMultMat = (mat: number[]): Vec => {
		if (!mat.length || mat.length !== 16) {
			console.error('[Vec #applyMult] invalid matrix provided for mult', mat)
			return this.clone()
		}
		const dest = new Vec()
		dest.x = mat[0] * this.x + mat[4] * this.y + mat[8] * this.z + mat[12]
		dest.y = mat[1] * this.x + mat[5] * this.y + mat[9] * this.z + mat[13]
		dest.z = mat[2] * this.x + mat[6] * this.y + mat[10] * this.z + mat[14]
		const w = mat[3] * this.x + mat[7] * this.y + mat[11] * this.z + mat[15]
		if (Math.abs(w) > Number.EPSILON) {
			dest.applyMult(1.0 / w)
		}
		return dest
	}
}
