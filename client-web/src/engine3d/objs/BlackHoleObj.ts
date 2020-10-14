import * as p5 from 'p5'
import { Obj, Vec } from '../core'
import { sketch } from 'app/Sketch'

export class BlackHoleObj extends Obj {
	origin2D = new Vec()
	scale2D = 1

	drawFunc = (pg: p5.Graphics) => {
		if (sketch && sketch.shaderBlackHole && sketch.backbuffer) {
			pg.shader(sketch.shaderBlackHole)
			sketch.shaderBlackHole.setUniform('backbuffer', sketch.backbuffer)
			sketch.shaderBlackHole.setUniform('size', [pg.width, pg.height])
			sketch.shaderBlackHole.setUniform('origin', [
				this.origin2D.x / pg.width,
				this.origin2D.y / pg.height,
			])
			sketch.shaderBlackHole.setUniform('scale', this.scale2D / pg.width)
		}
		pg.colorMode(pg.HSL, 1)
		pg.fill(0, 0).noStroke() // stroke(sketch.ground.hue, 1.0, 0.7)
		pg.translate(0, -1, 0)
		pg.sphere(1, 5, 5)
		pg.translate(0, 2, 0)
		pg.box(2, 2, 2)
		pg.colorMode(pg.RGB, 255)
		pg.resetShader()
	}

	drawFunc2D = (_pp: p5, pos: Vec, scale: number) => {
		this.origin2D = pos
		this.scale2D = scale
	}
}
