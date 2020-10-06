import { Body, Vec3 } from 'cannon'
import { Obj, ObjOpts } from '../Obj'
import { Collidable } from '../components/Collidable'

type KeyMovement = {
	up: boolean
	down: boolean
	left: boolean
	right: boolean
	jump: boolean
	gain: number
}

export class Avatar extends Obj {
	coll: Collidable

	constructor(opts: ObjOpts) {
		super(opts)
		this.coll = new Collidable(this)
		this.comps = [this.coll]
		console.log('[Avatar] ctor', this)
	}

	updateMov = (mov: KeyMovement) => {
		// const { up, down, left, right, jump, gain } = mov
		// const { up, down, left, right, gain } = mov
		const { up, down, left, right } = mov
		const gain = 5
		const accel = new Vec3()
		accel.x = left && right ? 0 : left ? -gain : right ? gain : 0
		accel.y = 0
		accel.z = down && up ? 0 : up ? -gain : down ? gain : 0
		if (accel.isZero()) { return }
		console.log('[Avatar] applying force', accel)
		// this.body.applyLocalForce(accel, new Vec3(0, 0, 0))
		// this.body.applyLocalImpulse(accel, new Vec3(0, 0, 0))
	}

	// update = () => {
	// }
}
