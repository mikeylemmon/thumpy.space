import * as p5 from 'p5'
import * as Tone from 'tone'
import { Component, Obj, ObjOpts } from '../core'

// type DanceMoveOpts = {
// 	env?: Partial<Tone.EnvelopeOptions>
// }
//
// class DanceMove {
// 	dancer: DancerObj
// 	env: Tone.Envelope
// 	releasing = false
// 	value = 0
//
// 	constructor(dancer: DancerObj, opts: DanceMoveOpts = {}) {
// 		this.dancer = dancer
// 		this.env = new Tone.Envelope(opts.env)
// 		this.env.triggerAttack(Tone.immediate())
// 	}
// 	update(dt: number) {
// 		this.value = this.env.value
// 	}
// 	release() {
// 		this.releasing = true
// 		this.env.triggerRelease(Tone.immediate())
// 	}
// 	isDone() { return this.releasing && this.value === 0}
// }
//
// class DanceMoveDip extends DanceMove {
// 	constructor(dancer: DancerObj, opts: DanceMoveOpts) {
// 		if (!opts.env) {
// 			opts.env = {
// 				attack: 0.1,
// 				sustain: 1,
// 				release: 0.5,
// 			}
// 		}
// 		super(dancer, opts)
// 	}
// 	update(dt: number) {
// 	}
// }

class DanceMoves extends Component {
	dip = new Tone.Envelope({
		attack: '16n',
		attackCurve: 'linear',
		sustain: 1,
		release: '8n',
		releaseCurve: 'linear',
	})

	update = (dt: number) => {
		// this.moves.forEach(mm => mm.update(dt))
		// this.moves = this.moves.filter(mm => !mm.isDone())
		this.parent.xform.pos.y = -this.dip.value
	}

	dipOn = (tt: number, attack: number = 1) => {
		this.dip.triggerAttack(tt, attack)
	}

	dipOff = (tt: number) => {
		this.dip.triggerRelease(tt)
	}

	// addDip = (beatMs: number) => {
	// 	this.moves.push(new DanceMoveDip(this.dancer, beatMs))
	// }
}

export class DancerObj extends Obj {
	moves: DanceMoves
	constructor(opts: ObjOpts = {}) {
		super(opts)
		this.moves = new DanceMoves(this)
		this.addComp(this.moves)
	}

	drawFunc = (pg: p5.Graphics) => {
		pg.fill(0)
		pg.stroke(255)
		pg.strokeWeight(2)
		pg.sphere(1, 7, 7)
	}

	drawShadowFunc = (pg: p5.Graphics) => {
		pg.push()
		pg.fill(30).noStroke()
		pg.rotateX(Math.PI / 2)
		pg.circle(0, 0, 2)
		pg.pop()
	}
}
