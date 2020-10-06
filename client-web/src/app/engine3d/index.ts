// import * as p5 from 'p5'
// import { AABB, Body, Plane, Quaternion, Sphere, Vec3, World } from 'cannon'

export * from './core'
export * from './engine3d'
export * from './Component'
export * from './Obj'
export * from './components/Collidable'
export * from './objs/Avatar'

// type Engine3DOpts = {
// 	debug?: boolean
// 	gravity?: Vec3
// }
//
// class Engine3D {
// 	objs: Obj[] = []
// 	debug = false
// 	simRate = 1.0 / 15.0
// 	simMaxSubSteps = 3
// 	world: World
// 	lastUpdate?: number
//
// 	constructor(opts: Engine3DOpts = {}) {
// 		if (opts.debug) { this.debug = true }
// 		this.world = new World()
// 		this.world.gravity = opts.gravity ? opts.gravity : new Vec3(0, 9.82, 0)
// 		this.world.addBody(new Body({
// 			mass: 0,
// 			shape: new Plane(),
// 			quaternion: new Quaternion().setFromEuler(Math.PI/2, 0, 0)
// 		}))
// 	}
//
// 	addObj = (obj: Obj) => this.objs.push(obj)
// 	rmObj = (obj: Obj) => {
// 		this.objs = this.objs.filter(oo => {
// 			if (oo === obj) {
// 				oo.destroy()
// 				return false
// 			}
// 			return true
// 		})
// 	}
//
// 	update = () => {
// 		if (!this.lastUpdate) {
// 			this.lastUpdate = new Date().valueOf()
// 			return
// 		}
// 		const dt = (new Date().valueOf() - this.lastUpdate) / 1000
// 		this.world.step(this.simRate, dt, this.simMaxSubSteps)
// 		this.objs.forEach(oo => oo.update())
// 	}
//
// 	draw = (pg: p5.Graphics) => {
// 		for (const obj of this.objs) {
// 			obj.draw(pg)
// 			if (this.debug) {
// 				this.drawObjDebug(pg, obj)
// 			}
// 		}
// 	}
//
// 	drawObjDebug = (pg: p5.Graphics, obj: Obj) => {
// 		const co = obj.getComp(Collidable) as Collidable
// 		if (!co) {
// 			return
// 		}
// 		// const { center, size } = co.worldBounds().centerAndSize()
// 		// const centerArr = center.toArray()
// 		// const sizeArr = size.toArray()
// 		// const physCol = co instanceof PhysObj ? [255, 0, 0] : [0, 255, 0]
//
// 		co.body.computeAABB()
// 		const { center, size } = centerAndSize(co.body.aabb)
// 		pg.push()
// 		pg.fill(0, 0)
// 		pg.stroke(255, 0, 0)
// 		pg.strokeWeight(1)
// 		pg.translate(center.x, center.y, center.z)
// 		pg.box(size.x, size.y, size.z)
// 		pg.pop()
// 	}
// }
//
// export const engine3d = new Engine3D({ debug: true })

// function centerAndSize(aabb: AABB) {
// 	const min = aabb.lowerBound
// 	const max = aabb.upperBound
// 	return {
// 		center: new Vec3(
// 			(max.x + min.x) / 2,
// 			(max.y + min.y) / 2,
// 			(max.z + min.z) / 2,
// 		),
// 		size: new Vec3(
// 			(max.x - min.x),
// 			(max.y - min.y),
// 			(max.z - min.z),
// 		),
// 	}
// }

// class Bounds {
// 	min = new Vec(-1.0)
// 	max = new Vec(1.0)
// 	constructor(min?: Vec, max?: Vec) {
// 		if (min) { this.min = min }
// 		if (max) { this.max = max }
// 	}
// 	copy = () => new Bounds(this.min.copy(), this.max.copy())
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
