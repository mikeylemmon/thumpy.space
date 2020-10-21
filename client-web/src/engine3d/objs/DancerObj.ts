import * as p5 from 'p5'
import * as Tone from 'tone'
import seedrandom from 'seedrandom'
import { MidiEventNote } from 'app/MIDI'
import { ControlChange } from 'app/Instrument'
import { InstControls } from 'app/InstControls'
import { Component, Obj, ObjOpts, Vec } from '../core'
import { Avatar } from './Avatar'

export type DancerCC = ControlChange & {
	ctrls: InstControls
	localUser: boolean
	time: number
}

const defaultEnvOpts = {
	attack: '0:0.25:0',
	attackCurve: 'linear',
	decay: '0:0.5:0',
	decayCurve: 'linear',
	sustain: 1,
	release: '0:0.5:0',
	releaseCurve: 'linear',
} as Tone.EnvelopeOptions

class DanceMoves extends Component {
	envs: { [key: string]: Tone.Envelope } = {
		dip: new Tone.Envelope(defaultEnvOpts),
		stepLeft: new Tone.Envelope(defaultEnvOpts),
		stepRight: new Tone.Envelope(defaultEnvOpts),
		spinLeft: new Tone.Envelope(defaultEnvOpts),
		spinRight: new Tone.Envelope(defaultEnvOpts),
		headbang: new Tone.Envelope(defaultEnvOpts),
		armsLUpperY: new Tone.Envelope(defaultEnvOpts),
		armsLUpperZ: new Tone.Envelope(defaultEnvOpts),
		armsLLowerX: new Tone.Envelope(defaultEnvOpts),
		armsRUpperY: new Tone.Envelope(defaultEnvOpts),
		armsRUpperZ: new Tone.Envelope(defaultEnvOpts),
		armsRLowerX: new Tone.Envelope(defaultEnvOpts),
	}

	update = (dt: number) => {
		const obj = this.parent as DancerObj
		const { envs } = this
		obj.xform.pos.y = -envs.dip.value * sizes.leg.y * 0.8
		obj.stepLeftRight = 0.5 * (envs.stepRight.value - envs.stepLeft.value)
		const avatar = obj.parent || obj
		avatar.xform.rot.y += dt * 20 * (envs.spinRight.value - envs.spinLeft.value)
		obj.rotHead.x = (envs.headbang.value * Math.PI) / 4
		obj.rotArms.l.upper.y = Math.PI * (0.4 - 0.7 * envs.armsLUpperY.value)
		obj.rotArms.r.upper.y = Math.PI * (0.4 - 0.7 * envs.armsRUpperY.value)
		obj.rotArms.l.upper.z = Math.PI * (1.1 + envs.armsLUpperZ.value)
		obj.rotArms.r.upper.z = Math.PI * (1.1 + envs.armsRUpperZ.value)
		obj.rotArms.l.lower.x = Math.PI * (0.1 + 0.7 * envs.armsLLowerX.value)
		obj.rotArms.r.lower.x = Math.PI * (0.1 + 0.7 * envs.armsRLowerX.value)
	}

	noteEnvMap: { [key: number]: Tone.Envelope } = {
		0: this.envs.dip,
		1: this.envs.spinLeft,
		2: this.envs.headbang,
		3: this.envs.spinRight,
		4: this.envs.stepLeft,
		5: this.envs.stepRight,
		6: this.envs.armsLUpperZ,
		7: this.envs.armsRUpperZ,
		8: this.envs.armsLLowerX,
		9: this.envs.armsRLowerX,
		10: this.envs.armsLUpperY,
		11: this.envs.armsRUpperY,
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

	handleADSR = (props: { [key: string]: string | number }) => {
		for (const kk in this.envs) {
			const env = this.envs[kk]
			env.set(props)
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

type DancerObjOpts = ObjOpts & {
	avatar: Avatar
}

export class DancerObj extends Obj {
	avatar: Avatar
	moves: DanceMoves
	rotHead = new Vec()
	rotArms = {
		l: defaultArmsRot(),
		r: defaultArmsRot(),
	}
	stepLeftRight = 0
	vol = 0.5
	colors: { [key: string]: { hue: number; sat: number; lgt: number } } = {
		stroke: { hue: 0, sat: 0, lgt: 0.9 },
		body: { hue: 0, sat: 0, lgt: 0 },
		head: { hue: 0, sat: 0, lgt: 0 },
		armUpper: { hue: 0, sat: 0, lgt: 0 },
		armLower: { hue: 0, sat: 0, lgt: 0 },
		hand: { hue: 0, sat: 0, lgt: 0 },
	}
	modwheel = 0

	constructor(opts: DancerObjOpts) {
		super(opts)
		this.avatar = opts.avatar
		this.moves = new DanceMoves(this)
		this.addComp(this.moves)
	}

	noteEvent = (time: number, evt: MidiEventNote) => {
		if (evt.attack) {
			evt.attack *= this.vol * 2
		}
		this.moves.noteEvent(time, evt)
	}

	handleCC = (cc: DancerCC) => {
		const { evt, ctrls, localUser, time } = cc
		if (!evt) {
			console.log('[DancerObj #handleCC] Received CC call with missing info', cc)
			return
		}
		const slider = ctrls.getSliderForCtrl(evt.controller.number)
		if (!slider) {
			console.log('[DancerObj #handleCC] Unable to find control for CC event', cc)
			return
		}
		if (localUser) {
			// Update sliders if evt is from the local user
			ctrls.controlchangeNext(evt)
			Tone.Draw.schedule(() => ctrls.controlchange(evt), time)
		}
		const tt = '0:' + evt.value + ':0' // Tone timecode for floating beat unit
		switch (slider.label) {
			case 'vol':
				this.vol = evt.value
				break
			case 'mod':
				Tone.Draw.schedule(() => {
					this.handleModwheel(evt.value)
					if (localUser) {
						// Call avatar.sendUserXform on slider release as a hacky way of saving the value
						slider.onRelease(this.avatar.sendUserXform)
					}
				}, time)
				break
			case 'a':
				this.moves.handleADSR({ attack: tt })
				break
			case 'd':
				this.moves.handleADSR({ decay: tt })
				break
			case 's':
				this.moves.handleADSR({ sustain: evt.value })
				break
			case 'r':
				this.moves.handleADSR({ release: tt })
				break
		}
	}

	handleModwheel = (val: number) => {
		this.modwheel = val
		const rng = seedrandom(`${val}`)
		for (const kk in this.colors) {
			const part = this.colors[kk]
			part.hue = rng.quick()
			part.sat = val ? rng.quick() * 0.7 + 0.3 : 0
			part.lgt = val * 0.7
			if (kk === 'stroke') {
				part.lgt = 0.9 - part.lgt
			}
		}
	}

	setFill = (pg: p5.Graphics, part: string) => {
		const col = this.colors[part]
		pg.fill(col.hue, col.sat, col.lgt)
	}

	drawFunc = (pg: p5.Graphics) => {
		const { leg, body } = sizes
		const { avatar } = this
		const cs = this.colors.stroke
		pg.colorMode(pg.HSL, 1)
		pg.stroke(cs.hue, cs.sat, cs.lgt)
		if (avatar.scale2D < 50) {
			pg.noStroke()
		} else if (avatar.scale2D < 200) {
			pg.strokeWeight(1)
		} else {
			pg.strokeWeight(2)
		}
		pg.translate(this.stepLeftRight, -1 + leg.y + body.y, 0)
		this.setFill(pg, 'body')
		pg.sphere(sizes.body.y, 7, 4)
		this.setFill(pg, 'head')
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
		this.setFill(pg, 'armUpper')
		pg.box(armUpper.x, armUpper.y, armUpper.z)
		pg.translate(0, 0.025 + armUpper.y / 2, 0)
		pg.rotateX(rot.lower.x)
		pg.translate(0, 0.025 + armLower.y / 2, 0)
		this.setFill(pg, 'armLower')
		pg.box(armLower.x, armLower.y, armLower.z)
		pg.translate(0, 0.05 + armLower.y / 2 + armLower.x / 2, 0)
		this.setFill(pg, 'hand')
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
