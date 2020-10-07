import { Bounds, Component, Obj, Vec } from '../core'

const gravity = new Vec(0, -9.82, 0)
export type PhysicalOpts = {
	bounds?: Bounds
	worldScale?: number
}

// Physical is a very simple physics implementation, applying forces
// to the parent object and constraining it to a hard-coded world bounds
export class Physical extends Component {
	force = new Vec()
	vel = new Vec()
	bounds: Bounds
	world: Bounds

	constructor(parent: Obj, opts: PhysicalOpts = {}) {
		super(parent)
		this.bounds = opts.bounds ? opts.bounds : new Bounds()
		if (!opts.worldScale) {
			opts.worldScale = 1000
		}
		this.world = new Bounds(
			new Vec(-opts.worldScale, 0, -opts.worldScale),
			new Vec(opts.worldScale, opts.worldScale, opts.worldScale),
		)
	}

	update = (dt: number) => {
		// Update velocity based on forces
		this.vel.applyAdd(gravity.cloneAdd(this.force).applyMult(dt))
		this.vel.applyMult(new Vec(0.8, 1.0, 0.8)) // friction in X and Z
		if (this.vel.magSq() < 0.01) {
			// Velocity threshold
			this.vel.applyMult(0)
		}
		// Update position based on velocity
		const { pos } = this.parent.xform
		pos.applyAdd(this.vel)
		// Constrain to world bounds
		const off = this.worldBounds().pushInside(this.world)
		if (off.isZero()) {
			return
		}
		// Apply constraint offset
		pos.applyAdd(off)
		// Bounce the velocity
		if (off.x !== 0) {
			this.vel.x *= -0.5
		}
		if (off.y !== 0) {
			this.vel.y *= -0.5
		}
		if (off.z !== 0) {
			this.vel.z *= -0.5
		}
	}

	drawDebug = (pg: p5.Graphics) => {
		const { center, size } = this.worldBounds().centerAndSize()
		pg.push()
		pg.noFill()
		pg.stroke(255, 0, 0)
		pg.strokeWeight(1)
		pg.translate(center.x, center.y, center.z)
		pg.box(size.x, size.y, size.z)
		pg.pop()
	}

	worldBounds = () => this.bounds.cloneXform(this.parent.xform)
}
