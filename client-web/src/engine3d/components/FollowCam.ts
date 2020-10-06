import { EasyCam } from 'vendor/p5.easycam.js'
import { Component, Obj } from '../core'

// FollowCam locks an EasyCam's center to the parent Obj
export class FollowCam extends Component {
	cam: EasyCam

	constructor(parent: Obj, cam: EasyCam) {
		super(parent)
		this.cam = cam
	}

	last?: number
	update = (dt: number) => {
		if (!this.cam.state || !this.cam.state.center) {
			return
		}
		const { x, y, z } = this.parent.xform.pos
		this.cam.setCenter([x, y, z], 0)
	}
}
