import * as p5 from 'p5'
import { Obj, ObjOpts } from '../core'

export class Ground extends Obj {
	hue: number
	sat: number

	constructor(opts: ObjOpts = {}) {
		const subDF = opts.draw
		opts.draw = (pg: p5.Graphics) => {
			pg.colorMode(pg.HSL, 1)
			// Draw ground plane
			pg.angleMode(pg.RADIANS)
			pg.fill(this.hue, this.sat, 0.3)
			pg.noStroke()
			pg.rotateX(Math.PI / 2)
			pg.rect(-1, -1, 2, 2)
			if (subDF) {
				subDF(pg)
			}
			pg.colorMode(pg.RGB, 255)
		}
		super(opts)
		this.hue = 0.5
		this.sat = 0
	}
}
