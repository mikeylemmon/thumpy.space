import * as p5 from 'p5'
import { EasyCam } from 'vendor/p5.easycam.js'
import { Obj, ObjOpts, Vec, Xform } from '../core'
import { Physical, PhysicalOpts, FollowCam } from '../components'

type KeyMovement = {
	up: boolean
	down: boolean
	left: boolean
	right: boolean
	jump: boolean
	jumpInitial: boolean
	gain: number
}

export type AvatarData = {
	force: Vec
	vel: Vec
	xform: Xform
}

type forceFunc = (data: AvatarData) => void

export type AvatarOpts = ObjOpts & {
	phys?: PhysicalOpts
	onForce?: forceFunc
}

export class Avatar extends Obj {
	phys: Physical
	followCam?: FollowCam
	onForce?: forceFunc

	keys: KeyMovement = {
		up: false,
		down: false,
		left: false,
		right: false,
		jump: false,
		jumpInitial: false,
		gain: 150,
	}

	constructor(opts: AvatarOpts) {
		super(opts)
		this.phys = new Physical(this, opts.phys)
		this.comps = [this.phys]
		this.onForce = opts.onForce
		console.log('[Avatar] ctor', this)
	}

	update(dt: number) {
		super.update(dt)
		if (this.keys.jumpInitial) {
			this.keys.jumpInitial = false
			this.keysUpdated()
		}
	}

	addFollowCam = (cam: EasyCam) => {
		this.followCam = new FollowCam(this, cam)
		this.followCam.update(0)
		this.addComp(this.followCam)
	}

	data = (): AvatarData => ({
		force: this.phys.force,
		vel: this.phys.vel,
		xform: this.xform,
	})

	//
	// Keyboard state updates and movement controls
	//
	keyPressed = (evt: p5) => this.keyChanged(evt, true)
	keyReleased = (evt: p5) => this.keyChanged(evt, false)
	keyChanged = (evt: p5, pressed: boolean) => {
		switch (evt.key) {
			case 'ArrowUp':
				this.keys.up = pressed
				break
			case 'ArrowDown':
				this.keys.down = pressed
				break
			case 'ArrowLeft':
				this.keys.left = pressed
				break
			case 'ArrowRight':
				this.keys.right = pressed
				break
			case ' ':
				this.keys.jump = pressed
				this.keys.jumpInitial = pressed
				break
			default:
				return
		}
		this.keysUpdated()
	}

	// keysUpdated applies force to the Physical component based on keyboard state and camera orientation
	keysUpdated = () => {
		const { up, down, left, right, jump, jumpInitial, gain } = this.keys
		const mov = new Vec()
		mov.x = left && right ? 0 : left ? -gain : right ? gain : 0
		mov.y = jumpInitial && this.xform.pos.y < this.xform.scale.y * 1.5 ? gain * 2 : jump ? 5 : 0
		mov.z = down && up ? 0 : up ? gain : down ? -gain : 0
		if (!this.followCam) {
			// Can't determine camera orientation, apply force in world-space
			this.phys.force = mov
			if (this.onForce) {
				this.onForce(this.data())
			}
			return
		}
		// Rotate movement vector based on camera orientation
		const ca = this.followCam.cam.centerAxes() // Y is world-up, X is screen right, Z is screen up
		const cax = new Vec(ca.x[0], ca.x[1], ca.x[2])
		const caz = new Vec(ca.z[0], ca.z[1], ca.z[2])
		const ff = new Vec(0, mov.y, 0)
		ff.applyAdd(cax.applyMult(mov.x))
		ff.applyAdd(caz.applyMult(mov.z))
		this.phys.force = ff
		if (this.onForce) {
			this.onForce(this.data())
		}
		// console.log('[Avatar] force updated', this.data())
	}

}
