import * as p5 from 'p5'
import { EasyCam } from 'vendor/p5.easycam.js'
import { User, UserForce, UserXform } from 'app/serverApi/serverApi'
import { sketch } from 'app/Sketch'
import { Obj, ObjOpts, Vec } from '../core'
import { Physical, PhysicalOpts, FollowCam } from '../components'
import { DancerObj } from './DancerObj'

type KeyMovement = {
	up: boolean
	down: boolean
	left: boolean
	right: boolean
	jump: boolean
	jumpInitial: boolean
	gain: number
}

type forceFunc = (data: UserXform) => void

export type AvatarOpts = ObjOpts & {
	user: User
	phys?: PhysicalOpts
	onForce?: forceFunc
}

export class Avatar extends Obj {
	phys: Physical
	user: User
	followCam?: FollowCam
	onForce?: forceFunc
	dancer: DancerObj
	facing: Vec
	scale2D = 100

	keys: KeyMovement = {
		up: false,
		down: false,
		left: false,
		right: false,
		jump: false,
		jumpInitial: false,
		gain: 100,
	}

	constructor(opts: AvatarOpts) {
		super(opts)
		this.user = opts.user
		this.phys = new Physical(this, opts.phys)
		this.comps = [this.phys]
		this.onForce = opts.onForce
		this.dancer = new DancerObj({ avatar: this })
		this.facing = new Vec(0, 0, 1)
		this.addChild(this.dancer)
		console.log('[Avatar] ctor', this)
	}

	update(dt: number) {
		super.update(dt)
		if (this.keys.jumpInitial) {
			this.keys.jumpInitial = false
			this.keysUpdated()
		}
	}

	drawFunc2D = (pp: p5, pos: Vec, scale: number) => {
		this.scale2D = scale
		if (sketch.inputs.hiddenLabels) {
			return
		}
		const { name, instrument, offset } = this.user
		if (scale < 15) {
			return // avatar is very small on screen, so no text
		}
		const ss = Math.min(scale, 50)
		const sss = Math.min(scale, 200)
		pp.translate(pos.x, pos.y)
		pp.textAlign(pp.CENTER, pp.BOTTOM)
		pp.fill(255)
		pp.noStroke()
		pp.textSize(ss / 2)
		pp.textStyle(pp.BOLD)
		if (scale < 50) {
			pp.text(name, 0, -ss * 0.8)
			return
		} else {
			pp.text(name, 0, -sss * 0.8)
		}
		pp.fill(225)
		pp.textSize(ss * 0.3)
		pp.textStyle(pp.ITALIC)
		pp.text(`${instrument} (@${offset > 0 ? '+' : ''}${offset})`, 0, -sss * 0.8 + ss * 0.35)
	}

	addFollowCam = (cam: EasyCam) => {
		this.followCam = new FollowCam(this, cam)
		this.followCam.update(0)
		this.addComp(this.followCam)
	}

	getUserXform = (): UserXform => ({
		clientId: this.user.clientId,
		pos: this.xform.pos.toArray(),
		rot: this.xform.rot.toArray(),
		scale: this.xform.scale.toArray(),
		force: this.phys.force.toArray(),
		vel: this.phys.vel.toArray(),
		dancerMod: this.dancer.modwheel,
	})

	sendUserXform = () => {
		if (this.onForce) {
			this.onForce(this.getUserXform())
		}
	}

	setUserXform = (data: UserXform) => {
		this.xform.pos.setFromArray(data.pos)
		this.xform.rot.setFromArray(data.rot)
		this.xform.scale.setFromArray(data.scale)
		this.phys.force.setFromArray(data.force)
		this.phys.vel.setFromArray(data.vel)
		this.dancer.handleModwheel(data.dancerMod)
	}

	setUserForce = (data: UserForce) => {
		this.phys.force.setFromArray(data.force)
	}

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
		mov.y = jumpInitial && this.xform.pos.y < this.xform.scale.y * 1.5 ? gain * 3 : jump ? 6 : 0
		mov.z = down && up ? 0 : up ? gain : down ? -gain : 0
		if (!this.followCam) {
			// Can't determine camera orientation, apply force in world-space
			this.phys.force = mov
			this.sendUserXform()
			return
		}
		// Convert movement vector to force based on camera orientation
		const ca = this.followCam.cam.centerAxes() // X=screen-right Z=screen-up, parallel to ground plane
		const cax = new Vec(ca.x[0], 0, ca.x[2])
		const caz = new Vec(ca.z[0], 0, ca.z[2])
		const ff = new Vec(0, mov.y, 0)
		ff.applyAdd(cax.applyMult(mov.x))
		ff.applyAdd(caz.applyMult(mov.z))
		this.phys.force = ff
		if (ff.x !== 0 || ff.z !== 0) {
			// Orient avatar to movement direction
			this.xform.rot.y = Math.atan2(ff.x, ff.z)
			this.facing = ff.clone().normalize()
		}
		this.sendUserXform()
	}
}
