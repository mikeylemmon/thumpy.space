import { EasyCam } from 'vendor/p5.easycam.js'
import { Obj, ObjOpts, Vec } from '../core'
import { Physical, PhysicalOpts, FollowCam } from '../components'

export type KeyMovement = {
	up: boolean
	down: boolean
	left: boolean
	right: boolean
	jump: boolean
	jumpInitial: boolean
	gain: number
}

export type AvatarOpts = ObjOpts & { phys?: PhysicalOpts }

export class Avatar extends Obj {
	phys: Physical
	followCam?: FollowCam
	movPrev = new Vec()

	constructor(opts: AvatarOpts) {
		super(opts)
		this.phys = new Physical(this, opts.phys)
		this.comps = [this.phys]
		console.log('[Avatar] ctor', this)
	}

	handleInput = (mov: KeyMovement) => {
		const { up, down, left, right, jump, jumpInitial, gain } = mov
		const accel = new Vec()
		accel.x = left && right ? 0 : left ? -gain : right ? gain : 0
		accel.y = jumpInitial && this.xform.pos.y < this.xform.scale.y * 1.5 ? gain * 2 : jump ? 5 : 0
		accel.z = down && up ? 0 : up ? gain : down ? -gain : 0
		mov.jumpInitial = false
		if (this.movPrev.isZero() && accel.isZero()) {
			return // no update required
		}
		this.movPrev = accel
		if (!this.followCam) {
			this.phys.force = accel
			return
		}
		const ca = this.followCam.cam.centerAxes()
		const cax = new Vec(ca.x[0], ca.x[1], ca.x[2])
		const caz = new Vec(ca.z[0], ca.z[1], ca.z[2])
		const ff = new Vec()
		ff.applyAdd(cax.applyMult(accel.x))
		ff.applyAdd(caz.applyMult(accel.z))
		ff.applyAdd(new Vec(0, accel.y, 0))
		this.phys.force = ff
	}

	addFollowCam = (cam: EasyCam) => {
		this.followCam = new FollowCam(this, cam)
		this.followCam.update(0)
		this.addComp(this.followCam)
	}
}
