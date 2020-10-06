import { Vec } from './Vec'
import { Xform } from './Xform'

export class Bounds {
	min = new Vec(-1.0)
	max = new Vec(1.0)

	constructor(min?: Vec, max?: Vec) {
		if (min) { this.min = min }
		if (max) { this.max = max }
	}

	clone = () => new Bounds(this.min.clone(), this.max.clone())
	cloneXform = (xform: Xform) => this.clone().applyXform(xform)

	applyXform = (xform: Xform) => {
		xform.applyTo(this.min)
		xform.applyTo(this.max)
		this.sanitize()
		return this
	}

	sanitize = () => {
		if (this.min.x > this.max.x) {
			const tmp = this.min.x
			this.min.x = this.max.x
			this.max.x = tmp
		}
		if (this.min.y > this.max.y) {
			const tmp = this.min.y
			this.min.y = this.max.y
			this.max.y = tmp
		}
		if (this.min.z > this.max.z) {
			const tmp = this.min.z
			this.min.z = this.max.z
			this.max.z = tmp
		}
		return this
	}

	// pushInside returns a zero vector if this bounds is inside the other bounds;
	// otherwise, returns the vector required to move this bounds into other
	pushInside = (other: Bounds): Vec => {
		const off = new Vec()
		if (this.min.x < other.min.x) {
			off.x = other.min.x - this.min.x
		} else if (this.max.x > other.max.x) {
			off.x = other.max.x - this.max.x
		}
		if (this.min.y < other.min.y) {
			off.y = other.min.y - this.min.y
		} else if (this.max.y > other.max.y) {
			off.y = other.max.y - this.max.y
		}
		if (this.min.z < other.min.z) {
			off.z = other.min.z - this.min.z
		} else if (this.max.z > other.max.z) {
			off.z = other.max.z - this.max.z
		}
		return off
	}

	centerAndSize = () => {
		return {
			center: new Vec(
				(this.max.x + this.min.x) / 2,
				(this.max.y + this.min.y) / 2,
				(this.max.z + this.min.z) / 2,
			),
			size: new Vec(
				(this.max.x - this.min.x),
				(this.max.y - this.min.y),
				(this.max.z - this.min.z),
			),
		}
	}
}
