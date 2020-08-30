// import * as p5 from 'p5'
import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
// import EngineInstrument from 'engine/EngineInstrument'
import Circle from 'engine/video/Circle'
// import apiInstruments, { StateInstrument } from 'storeLocal/apiInstruments'
import apiInstruments from 'storeLocal/apiInstruments'
import { StateLocal } from 'storeLocal/rootReducerLocal'
import engine from 'engine/Engine'

type OwnProps = {
	instId: string
}

const VideoOutput: React.FC<OwnProps> = ({ instId }) => {
	const ref = useRef<HTMLDivElement>(null)
	const inst = useSelector((state: StateLocal) => apiInstruments.selectById(state, instId))
	useEffect(() => {
		if (!inst) {
			console.warn('[VideoOutput #useEffect] No instrument found for id', instId)
			return
		}
		console.log('[VideoOutput #useEffect]', inst)
		const engInst = engine.instrumentById(inst.id) as Circle
		if (!engInst) {
			console.warn('[VideoOutput #useEffect] No engine instrument for', instId)
			return
		}
		if (!ref.current) {
			console.warn('[VideoOutput #useEffect] No ref for', instId)
			return
		}
		const cur = ref.current as HTMLDivElement
		if (cur.childNodes[0]) {
			cur.removeChild(cur.childNodes[0])
		}
		const canvas = new window.p5(engInst.sketch, cur)
		return () => {
			canvas.remove()
			console.log('[VideoOutput #useEffect.return]')
		}
	}, [inst, instId]) // Only re-run the effect if instrument changes
	return (
		<div
			ref={ref}
			style={{
				display: 'flex',
				flex: 1,
				backgroundColor: 'green',
			}}
		>
			hello
		</div>
	)
}

export default VideoOutput
