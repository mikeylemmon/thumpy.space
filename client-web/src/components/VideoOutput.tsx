import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import Puddleish from 'engine/video/Puddleish'
import apiInstruments from 'storeLocal/apiInstruments'
import { StateLocal } from 'storeLocal/rootReducerLocal'
import engine from 'engine/Engine'

type OwnProps = {
	instId: string
}

const VideoOutput: React.FC<OwnProps> = ({ instId }) => {
	const ref = useRef<HTMLDivElement>(null)
	const inst = useSelector((state: StateLocal) => apiInstruments.selectById(state, instId))
	const msg = useRef<string>(`Loading ${instId}`)
	useEffect(() => {
		if (!inst) {
			msg.current = `No instrument found for id ${instId}`
			return
		}
		// Currently hardcoded to Puddleish. TODO: formalize video instrument API into an interface
		const engInst = engine.instrumentById(inst.id) as Puddleish
		if (!engInst) {
			msg.current = `No engine instrument for ${instId}`
			console.warn(`[VideoOutput #useEffect] ${msg.current}`)
			return
		}
		if (!ref.current) {
			msg.current = `Internal component error for ${instId}`
			console.warn(`[VideoOutput #useEffect] No ref for ${instId}`)
			return
		}
		const cur = ref.current as HTMLDivElement
		if (cur.childNodes[0]) {
			cur.removeChild(cur.childNodes[0]) // remove previous sketch
		}
		const { clientWidth, clientHeight } = cur
		engInst.setSize(clientWidth, clientHeight)
		const sketch = new window.p5(engInst.sketch, cur)
		return () => {
			sketch.remove()
			console.log('[VideoOutput #useEffect.return]')
		}
	}, [inst, instId]) // Only re-run the effect if instrument or size changes
	return (
		<div
			ref={ref}
			style={{
				display: 'flex',
				flex: 1,
				alignItems: 'center',
				justifyContent: 'center',
				color: 'white',
			}}
		>
			{msg.current}
		</div>
	)
}

export default VideoOutput
