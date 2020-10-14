import * as p5 from 'p5'
import { Obj, Vec } from '../core'
import { sketch } from 'app/Sketch'
import { BlackHole } from 'app/instruments'

export class BlackHoleObj extends Obj {
	origin2D = new Vec()
	scale2D = 1

	draw(pg: p5.Graphics) {
		if (sketch && sketch.shaderBlackHole && sketch.backbuffer) {
			const blackHole = sketch.instruments.blackHole as BlackHole
			pg.shader(sketch.shaderBlackHole)
			sketch.shaderBlackHole.setUniform('backbuffer', sketch.backbuffer)
			sketch.shaderBlackHole.setUniform('size', [pg.width, pg.height])
			sketch.shaderBlackHole.setUniform('rotate', blackHole.modwheel * Math.PI)
		}
		pg.fill(0, 0).noStroke()
		super.draw(pg) // apply xform and draw children
		pg.resetShader()
	}
}
