import { Body, Box, Sphere, Vec3 } from 'cannon'
import { Vec } from '../core'
import { engine3d, matDefault } from '../engine3d'
import { Component } from '../Component'
import { Obj } from '../Obj'

// class Bounds {
// 	min = new Vec(-1.0)
// 	max = new Vec(1.0)
// 	constructor(min?: Vec, max?: Vec) {
// 		if (min) { this.min = min }
// 		if (max) { this.max = max }
// 	}
// 	copy = () => new Bounds(this.min.clone(), this.max.clone())
// 	centerAndSize = () => {
// 		return {
// 			center: new Vec(
// 				(this.max.x + this.min.x) / 2,
// 				(this.max.y + this.min.y) / 2,
// 				(this.max.z + this.min.z) / 2,
// 			),
// 			size: new Vec(
// 				(this.max.x - this.min.x),
// 				(this.max.y - this.min.y),
// 				(this.max.z - this.min.z),
// 			),
// 		}
// 	}
// 	sanitize = () => {
// 		if (this.min.x > this.max.x) {
// 			const tmp = this.min.x
// 			this.min.x = this.max.x
// 			this.max.x = tmp
// 		}
// 		if (this.min.y > this.max.y) {
// 			const tmp = this.min.y
// 			this.min.y = this.max.y
// 			this.max.y = tmp
// 		}
// 		if (this.min.z > this.max.z) {
// 			const tmp = this.min.z
// 			this.min.z = this.max.z
// 			this.max.z = tmp
// 		}
// 	}
// }

export class Collidable extends Component {
	body: Body

	constructor(parent: Obj, body?: Body) {
		super(parent)
		if (body) {
			this.body = body
		} else {
			const { x: posx, y: posy, z: posz } = this.parent.xform.pos
			const { x: scalex, y: scaley, z: scalez } = this.parent.xform.scale
			this.body = new Body({
				mass: 5,
				position: new Vec3(posx, posy, posz),
				shape: new Box(new Vec3(scalex, scaley, scalez)),
				material: matDefault,
			})
		}
		engine3d.world.addBody(this.body)
	}
	update = () => {
		// console.log('[Collidable] update')
		const { x, y, z } = this.body.position
		const rot = new Vec3()
		this.body.quaternion.toEuler(rot)
		this.parent.xform.pos.x = x
		this.parent.xform.pos.y = y
		this.parent.xform.pos.z = z
		this.parent.xform.rot.x = rot.x
		this.parent.xform.rot.y = rot.y
		this.parent.xform.rot.z = rot.z
	}
	// worldBounds = (): Bounds => {
	// 	const wb = this.bounds.copy()
	// 	this.parent.xform.applyTo(wb.min)
	// 	this.parent.xform.applyTo(wb.max)
	// 	wb.sanitize()
	// 	return wb
	// }
}
