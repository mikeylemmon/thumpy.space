import * as p5 from 'p5'
import * as Tone from 'tone'
import { Component, Obj, ObjOpts, Vec } from '../core'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from 'app/MIDI'

const defaultEnvOpts = {
	attack: '16n',
	attackCurve: 'linear',
	sustain: 1,
	release: '8n',
	releaseCurve: 'linear',
} as Tone.EnvelopeOptions

class DanceMoves extends Component {
	dip = new Tone.Envelope(defaultEnvOpts)
	stepLeft = new Tone.Envelope(defaultEnvOpts)
	stepRight = new Tone.Envelope(defaultEnvOpts)
	spinLeft = new Tone.Envelope(defaultEnvOpts)
	spinRight = new Tone.Envelope(defaultEnvOpts)
	headbang = new Tone.Envelope(defaultEnvOpts)
	arms = {
		l: {
			upper: {
				y: new Tone.Envelope(defaultEnvOpts),
				z: new Tone.Envelope(defaultEnvOpts),
			},
			lower: {
				x: new Tone.Envelope(defaultEnvOpts),
			},
		},
		r: {
			upper: {
				y: new Tone.Envelope(defaultEnvOpts),
				z: new Tone.Envelope(defaultEnvOpts),
			},
			lower: {
				x: new Tone.Envelope(defaultEnvOpts),
			},
		},
	}

	update = (dt: number) => {
		const obj = this.parent as DancerObj
		obj.xform.pos.y = -this.dip.value * sizes.leg.y * 0.8
		obj.stepLeftRight = 0.7 * (this.stepRight.value - this.stepLeft.value)
		const avatar = obj.parent || obj
		avatar.xform.rot.y += dt * 20 * (this.spinRight.value - this.spinLeft.value)
		obj.rotHead.x = (this.headbang.value * Math.PI) / 4
		obj.rotArms.l.upper.y = Math.PI * (0.4 - 0.7 * this.arms.l.upper.y.value)
		obj.rotArms.r.upper.y = Math.PI * (0.4 - 0.7 * this.arms.r.upper.y.value)
		obj.rotArms.l.upper.z = Math.PI * (1.1 + this.arms.l.upper.z.value)
		obj.rotArms.r.upper.z = Math.PI * (1.1 + this.arms.r.upper.z.value)
		obj.rotArms.l.lower.x = Math.PI * (0.1 + 0.7 * this.arms.l.lower.x.value)
		obj.rotArms.r.lower.x = Math.PI * (0.1 + 0.7 * this.arms.r.lower.x.value)
	}

	noteEnvMap: { [key: number]: Tone.Envelope } = {
		0: this.dip,
		1: this.spinLeft,
		2: this.headbang,
		3: this.spinRight,
		4: this.stepLeft,
		5: this.stepRight,
		6: this.arms.l.upper.z,
		7: this.arms.r.upper.z,
		8: this.arms.l.lower.x,
		9: this.arms.r.lower.x,
		10: this.arms.l.upper.y,
		11: this.arms.r.upper.y,
	}

	noteEvent = (time: number, evt: MidiEventNote) => {
		const { kind, note, attack } = evt
		const move = this.noteEnvMap[note % 12]
		if (kind === 'noteon') {
			move.triggerAttack(time, attack)
		} else {
			move.triggerRelease(time)
		}
	}
}

const sizes = {
	leg: new Vec(0.1, 0.5, 0.1),
	armUpper: new Vec(0.1, 0.3, 0.1),
	armLower: new Vec(0.1, 0.3, 0.1),
	body: new Vec(0.4),
	neck: new Vec(0.05),
	head: new Vec(0.25),
}

const defaultArmsRot = () => ({
	upper: new Vec(0, Math.PI * 0.4, Math.PI * 1.1),
	lower: new Vec(Math.PI * 0.1, 0, 0),
})

export class DancerObj extends Obj {
	moves: DanceMoves
	rotHead = new Vec()
	rotArms = {
		l: defaultArmsRot(),
		r: defaultArmsRot(),
	}
	stepLeftRight = 0

	constructor(opts: ObjOpts = {}) {
		super(opts)
		this.moves = new DanceMoves(this)
		this.addComp(this.moves)
	}

	drawFunc = (pg: p5.Graphics) => {
		pg.fill(0).stroke(255).strokeWeight(2)
		const { leg, body } = sizes
		pg.translate(this.stepLeftRight, -1 + leg.y + body.y, 0)
		pg.sphere(sizes.body.y, 7, 4)
		this.drawHead(pg)
		this.drawArm(pg, true)
		this.drawArm(pg, false)
	}

	drawHead = (pg: p5.Graphics) => {
		const { body, neck, head } = sizes
		pg.push()
		pg.rotateX(this.rotHead.x)
		pg.push()
		pg.translate(0, body.y + neck.y + head.y, 0)
		pg.box(head.y * 1.8, head.y * 1.8, head.y * 1.8)
		pg.pop()
		pg.pop()
	}

	drawArm = (pg: p5.Graphics, left = true) => {
		const { body, armUpper, armLower } = sizes
		const rot = left ? this.rotArms.l : this.rotArms.r
		pg.push()
		if (left) {
			pg.scale(-1, 1, 1)
		}
		pg.translate(body.x, body.y * 0.8, 0)
		pg.rotateZ(rot.upper.z).rotateY(rot.upper.y)
		pg.translate(0, armUpper.y / 2, 0)
		pg.box(armUpper.x, armUpper.y, armUpper.z)
		pg.translate(0, 0.025 + armUpper.y / 2, 0)
		pg.rotateX(rot.lower.x)
		pg.translate(0, 0.025 + armLower.y / 2, 0)
		pg.box(armLower.x, armLower.y, armLower.z)
		pg.translate(0, 0.05 + armLower.y / 2 + armLower.x / 2, 0)
		pg.box(armLower.x, armLower.x, armLower.x)
		pg.pop()
	}

	drawShadowFunc = (pg: p5.Graphics) => {
		pg.push()
		pg.fill(30).noStroke()
		pg.rotateX(Math.PI / 2)
		pg.circle(this.stepLeftRight, 0, sizes.body.x * 2)
		pg.pop()
	}
}
