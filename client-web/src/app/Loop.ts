import * as p5 from 'p5'
import * as Tone from 'tone'
import Sketch from './Sketch'

export type LoopOpts = {
	beats: number
	sketch: Sketch
}

export class Loop {
	opts: LoopOpts
	isActive = true

	constructor(opts: LoopOpts) {
		this.opts = opts
	}

	blur = () => (this.isActive = false)

	draw = (pp: p5) => {
		const { beats, sketch } = this.opts
		const loopLenSec = beats * sketch.beatSec()
		let rad = 50
		const xx = pp.width - rad - 20
		const yy = rad + 20
		pp.fill(30)
		pp.stroke(0)
		pp.strokeWeight(2)
		pp.circle(xx, yy, rad * 2)
		// const drawLine = (nn: number, doArcPlay: boolean = false, doArcRec: boolean = false) => {
		const drawLine = (nn: number) => {
			const theta = Math.PI * 2 * nn
			const lx = xx + (rad - 2) * Math.sin(theta)
			const ly = yy - (rad - 2) * Math.cos(theta)
			pp.line(xx, yy, lx, ly)
			// if (doArcPlay || doArcRec) {
			// 	pp.noStroke()
			// 	pp.fill(doArcRec ? 200 : 0, doArcPlay ? 200 : 0, 0, 70)
			// 	pp.arc(xx, yy, rad * 2, rad * 2, -Math.PI / 2, theta - Math.PI / 2)
			// }
		}
		const drawArc = (nn: number) => {
			const theta = Math.PI * 2 * nn
			const lx = xx + (rad - 2) * Math.sin(theta)
			const ly = yy - (rad - 2) * Math.cos(theta)
			pp.noStroke()
			pp.arc(xx, yy, rad * 2, rad * 2, -Math.PI / 2, theta - Math.PI / 2)
		}
		for (let ii = 0; ii < beats; ii++) {
			const isDown = ii % 4 === 0
			const isFirst = ii === 0
			pp.stroke(isFirst ? 180 : isDown ? 130 : 80)
			pp.strokeWeight(isFirst ? 3 : isDown ? 2 : 1)
			const bb = ii / beats
			// const doArcPlay = Math.ceil(headPlay * beats) % beats === ii
			// const doArcRec = Math.ceil(headRec * beats) % beats === ii
			// drawLine(bb, doArcPlay, doArcRec)
			drawLine(bb)
		}

		const now = Tone.immediate()
		let headPlay = (now - sketch.downbeat) / loopLenSec
		headPlay = headPlay - Math.floor(headPlay) // 0-1 from start to end of loop
		const arcPlay = (Math.ceil(headPlay * beats) % beats) / beats
		let headRec = (now + sketch.offsetSec() - sketch.downbeat) / loopLenSec
		headRec = headRec - Math.floor(headRec) // 0-1 from start to end of loop
		const arcRec = (Math.ceil(headRec * beats) % beats) / beats
		pp.fill(0, 200, 0, 60)
		drawArc(arcPlay)
		pp.fill(200, 0, 0, 120)
		rad *= 0.7
		drawArc(arcRec)

		rad /= 0.7
		pp.stroke(0, 200, 0)
		pp.strokeWeight(3)
		drawLine(headPlay)
		pp.strokeWeight(4)
		pp.stroke(200, 0, 0)
		rad *= 0.7
		drawLine(headRec)
	}
}
