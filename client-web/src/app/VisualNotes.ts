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

	update = (pg: p5.Graphics, others: VisualNote[]) => {
		const close = 50,
			weightVC = 1.8,
			weightC = 0.2,
			weightF = 1.0 / 500000,
			weightU = 0.003,
			ux = this.user.posX - 0.5,
			uy = 1.0 - this.user.posY

		if (this.firstUpdate) {
			// transform original normalized position into screen space
			this.x = pg.width * (ux + 0.1 * (Math.random() * 2 - 1))
			this.y = pg.height * (uy + 0.1 * (Math.random() * 2 - 1))
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
		this.velx -= weightU * (this.x - ux * pg.width)
		this.vely -= weightU * (this.y - uy * pg.height)
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
				// notes bounce off each other if they're touching
				this.velx += (weightVC * sx * (cc * 3 - ddx)) / cc
				this.vely += (weightVC * sy * (cc * 3 - ddy)) / cc
			} else if (outerDist < close) {
				// notes repel each other a little if they're not touching but still close
				this.velx += (weightC * sx * ddx) / cc
				this.vely += (weightC * sy * ddy) / cc
			} else if (other.evt.instrument === this.evt.instrument) {
				// notes from the same instrument spring towards each other when they're far away
				this.velx -= weightF * sx * ddx
				this.vely -= weightF * sy * ddy
			}
		}
		// bounce off the walls
		const nx = this.x + pg.width / 2,
			ny = this.y + pg.height / 2
		if ((nx < this.radius && this.velx < 0) || (nx > pg.width - this.radius && this.velx > 0)) {
			this.velx *= -1
		}
		if ((ny < this.radius && this.vely < 0) || (ny > pg.height - this.radius && this.vely > 0)) {
			this.vely *= -1
		}
		this.x += this.velx
		this.y += this.vely
	}

	draw = (pp: p5, pg: p5.Graphics) => {
		pg.colorMode(pp.HSL, 1)
		const { instrument, midiEvent } = this.evt
		const { attack, note } = midiEvent
		const aa = attack || 0.5
		const sat = aa * 0.3 + 0.55
		const size = this.radius * 2 * this.young
		switch (instrument) {
			case 'eightOhEight': {
				const hue = (note % 16) / 16
				pg.fill(hue * 0.4 + 0.05, sat, 0.45, this.health)
				pg.square(this.x - size / 2, this.y - size / 2, size)
				break
			}
			default: {
				const hue = (note % 12) / 12
				const lgt = Math.min(note / 128 + 0.2, 0.65)
				pg.fill(hue * 0.25 + 0.55, sat, lgt, this.health)
				pg.circle(this.x, this.y, size)
				break
			}
		}
		pg.colorMode(pp.RGB, 255)
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
			console.warn('[VisualNotes #noteoff] Unable to find note for event', evt)
			return
		}
		notes.forEach(nn => nn.release())
	}

	isSameNote = (note: VisualNote, evt: UserEvent) => {
		return note.evt.instrument === evt.instrument && note.evt.midiEvent.note === evt.midiEvent.note
	}

	/*eslint no-lone-blocks: "off"*/
	draw = (pp: p5, pg: p5.Graphics) => {
		this.notes = this.notes.filter(nn => !nn.isDead())
		this.notes.forEach(nn => nn.update(pg, this.notes))
		pg.perspective(Math.PI / 3, pg.width / pg.height, 0.5, 10000)
		pg.clear()
		{
			// Draw notes
			pg.push()
			this.notes.forEach(nn => nn.draw(pp, pg))
			pg.pop()
		}
	}
}
