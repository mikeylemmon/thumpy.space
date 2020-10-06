import * as p5 from 'p5'
import { Obj, ObjOpts } from '../core'

export class Ground extends Obj {
	constructor(opts: ObjOpts = {}) {
		const subDF = opts.draw
		opts.draw = (pg: p5.Graphics) => {
			// Draw ground plane
			pg.angleMode(pg.RADIANS)
			pg.fill(80)
			pg.stroke(255)
			pg.rotateX(Math.PI / 2)
			pg.rect(-1, -1, 2, 2)
			if (subDF) {
				subDF(pg)
			}
		}
		super(opts)
	}
}
