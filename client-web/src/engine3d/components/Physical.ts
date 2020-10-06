import { Bounds, Component, Obj, Vec } from '../core'

const world = new Bounds(
	new Vec(-1000, -1000, -1000),
	new Vec(1000, 0, 1000),
)

const gravity = new Vec(0, 9.82, 0)

// Physical is a very simple physics implementation, applying forces
// to the parent object and constraining it to a hard-coded world bounds
export class Physical extends Component {
	force = new Vec()
	vel = new Vec()
	bounds: Bounds

	constructor(parent: Obj, bounds?: Bounds) {
		super(parent)
		this.bounds = bounds ? bounds : new Bounds()
	}

	update = (dt: number) => {
		// Update velocity based on forces
		this.vel.applyAdd(gravity.cloneAdd(this.force).applyMult(dt))
		this.vel.applyMult(new Vec(0.8, 1.0, 0.8)) // friction in X and Z
		// Update position based on velocity
		const { pos } = this.parent.xform
		pos.applyAdd(this.vel)
		// Constrain to world bounds
		const off = this.worldBounds().pushInside(world)
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
		pg.fill(0, 0)
		pg.stroke(255, 0, 0)
		pg.strokeWeight(1)
		pg.translate(center.x, center.y, center.z)
		pg.box(size.x, size.y, size.z)
		pg.pop()
	}

	worldBounds = () => this.bounds.cloneXform(this.parent.xform)
}
