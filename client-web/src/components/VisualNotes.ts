import * as p5 from 'p5'
import { User, UserEvent } from './serverApi/serverApi'

class VisualNote {
	age: number = 0
	released: boolean = false
	firstUpdate: boolean = true
	ageReleased: number = 0
	x: number = -1
	y: number = -1
	velx: number = 0
	vely: number = 0
	young: number = 2.0 // decreases to 1 over youngDur frames
	health: number = 1.0 // after release, decreases to 0 over fadeOut frames
	youngDur: number // number of frames this note is 'young' (i.e. in attack)
	fadeOut: number // number of frames to fade away after release
	radius: number
	radiusOrig: number
	evt: UserEvent
	user: User

	constructor(evt: UserEvent, user: User) {
		this.evt = evt
		this.user = user
		const aa = this.evt.midiEvent.attack || 0.5
		this.radius = aa * 25 + 5
		this.radiusOrig = this.radius
		switch (evt.instrument) {
			case 'eightOhEight':
				this.youngDur = 2
				this.fadeOut = 3
				break
			default:
				this.youngDur = 5
				this.fadeOut = 10
				break
		}
	}

	release = () => {
		this.released = true
		this.ageReleased = this.age
	}

	isDead = () => this.released && this.age - this.ageReleased > this.fadeOut

	update = (pp: p5, others: VisualNote[]) => {
		const close = 50,
			weightVC = 1.8,
			weightC = 0.2,
			weightF = 1.0 / 500000,
			weightU = 0.003

		if (this.firstUpdate) {
			// transform original normalized position into screen space
			this.x = pp.width * (this.user.posX + 0.1 * (Math.random() * 2 - 1))
			this.y = pp.height * (this.user.posY + 0.1 * (Math.random() * 2 - 1))
			this.firstUpdate = false
		}

		this.young = Math.max(1.0, 2.0 - this.age / this.youngDur)
		this.age++
		if (this.released) {
			this.health = 1.0 - (this.age - this.ageReleased) / this.fadeOut
		}
		this.radius = this.radiusOrig * this.health

		this.velx *= 0.924
		this.vely *= 0.924
		this.velx -= weightU * (this.x - this.user.posX * pp.width)
		this.vely -= weightU * (this.y - this.user.posY * pp.height)
		for (const other of others) {
			if (other === this) {
				continue
			}
			const dx = this.x - other.x
			const dy = this.y - other.y
			const ddx = dx * dx
			const ddy = dy * dy
			const sx = dx < 0 ? -1 : 1
			const sy = dy < 0 ? -1 : 1
			const dd = Math.sqrt(ddx + ddy)
			const cc = close * close
			const outerDist = dd - (this.radius + other.radius)
			if (outerDist < 0) {
				this.velx += (weightVC * sx * (cc * 3 - ddx)) / cc
				this.vely += (weightVC * sy * (cc * 3 - ddy)) / cc
			} else if (outerDist < close) {
				// this.velx += (weightC * (sx * (close - ddx))) / close
				// this.vely += (weightC * (sy * (close - ddy))) / close
				this.velx += (weightC * sx * ddx) / cc
				this.vely += (weightC * sy * ddy) / cc
			} else {
				// notes from the same instrument gravitate towards each other,
				// notes from different instruments repell a bit
				const charge = other.evt.instrument === this.evt.instrument ? 1 : -0.2
				this.velx -= weightF * charge * sx * ddx
				this.vely -= weightF * charge * sy * ddy
			}
		}
		// bounce off the walls
		if ((this.y < this.radius && this.vely < 0) || (this.y > pp.height - this.radius && this.vely > 0)) {
			this.vely *= -1
		}
		if ((this.x < this.radius && this.velx < 0) || (this.x > pp.width - this.radius && this.velx > 0)) {
			this.velx *= -1
		}
		this.y += this.vely
		this.x += this.velx
	}

	draw = (pp: p5) => {
		pp.colorMode(pp.HSL, 1)
		const { instrument, midiEvent } = this.evt
		const { attack, note } = midiEvent
		const aa = attack || 0.5
		const sat = aa * 0.3 + 0.55
		const size = this.radius * 2 * this.young
		switch (instrument) {
			case 'eightOhEight': {
				const hue = (note % 16) / 16
				pp.fill(hue * 0.4 + 0.05, sat, 0.45, this.health)
				pp.square(this.x - size / 2, this.y - size / 2, size)
				break
			}
			default: {
				const hue = (note % 12) / 12
				const lgt = Math.min(note / 128 + 0.2, 0.65)
				pp.fill(hue * 0.25 + 0.55, sat, lgt, this.health)
				pp.circle(this.x, this.y, size)
				break
			}
		}
		pp.colorMode(pp.RGB, 255)
	}
}

export default class VisualNotes {
	notes: VisualNote[] = []

	noteon = (evt: UserEvent, user: User) => {
		this.notes.push(new VisualNote(evt, user))
	}

	noteoff = (evt: UserEvent) => {
		const notes = this.notes.filter(nn => !nn.released && this.isSameNote(nn, evt))
		if (!notes.length) {
			console.error('[VisualNotes #noteoff] Unable to find note for event', evt)
			return
		}
		notes.forEach(nn => nn.release())
	}

	isSameNote = (note: VisualNote, evt: UserEvent) => {
		return note.evt.instrument === evt.instrument && note.evt.midiEvent.note === evt.midiEvent.note
	}

	draw = (pp: p5) => {
		this.notes = this.notes.filter(nn => !nn.isDead())
		this.notes.forEach(nn => nn.update(pp, this.notes))
		this.notes.forEach(nn => nn.draw(pp))
	}
}
