import React, { useEffect, useRef } from 'react'
import { sketch } from './Sketch'

const VideoOutput: React.FC = () => {
	const ref = useRef<HTMLDivElement>(null)
	const msg = useRef<string>(`Loading`)
	useEffect(() => {
		if (!ref.current) {
			msg.current = `Internal component error`
			console.warn(`[VideoOutput #useEffect] Can't find component reference`)
			return
		}
		const elem = ref.current as HTMLDivElement
		if (elem.childNodes[0]) {
			elem.removeChild(elem.childNodes[0]) // remove previous sketch
		}
		const { clientWidth, clientHeight } = elem
		sketch.setSize(clientWidth, clientHeight)
		const canvas = new window.p5(sketch.sketch, elem)
		return () => {
			sketch.destroy()
			canvas.remove()
			console.log('[VideoOutput #useEffect.return]')
		}
	})
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
