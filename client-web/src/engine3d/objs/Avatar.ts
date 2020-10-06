import { Obj, ObjOpts, Vec } from '../core'
import { Physical } from '../components/Physical'

type KeyMovement = {
	up: boolean
	down: boolean
	left: boolean
	right: boolean
	jump: boolean
	gain: number
}

export class Avatar extends Obj {
	phys: Physical

	constructor(opts: ObjOpts) {
		super(opts)
		this.phys = new Physical(this)
		this.comps = [this.phys]
		console.log('[Avatar] ctor', this)
	}

	updateMov = (mov: KeyMovement) => {
		const { up, down, left, right, jump, gain: gg } = mov
		const gain = gg * 30
		const accel = new Vec()
		accel.x = left && right ? 0 : left ? -gain : right ? gain : 0
		// accel.y = jump ? -gain : 0
		accel.z = down && up ? 0 : up ? -gain : down ? gain : 0
		this.phys.force = accel
	}

	// update = () => {
	// }
}
