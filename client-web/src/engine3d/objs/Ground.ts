import * as p5 from 'p5'
import { Obj } from '../core'

export class Ground extends Obj {
	hue = 0
	sat = 0
	lgt = 0.25

	drawFunc = (pg: p5.Graphics) => {
		pg.colorMode(pg.HSL, 1).noFill().strokeWeight(4).stroke(this.hue, this.sat, 0.25)
		pg.rotateX(Math.PI / 2)
		// // Draw the perimeter
		// pg.rect(-1, -1, 2, 2)
		pg.circle(0, 0, 2.5)
		// Draw a square at the origin and in the middle of each quadrant to help
		// give the user more reference for distance as they move around
		const sz = 0.05
		pg.rect(-sz, -sz, sz * 2, sz * 2)
		pg.rect(-0.5 - sz, -0.5 - sz, sz * 2, sz * 2)
		pg.rect(0.5 - sz, -0.5 - sz, sz * 2, sz * 2)
		// pg.rect(0.5 - sz, 0.5 - sz, sz * 2, sz * 2)
		// pg.rect(-0.5 - sz, 0.5 - sz, sz * 2, sz * 2)
	}
}
