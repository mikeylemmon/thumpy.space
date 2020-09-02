import React from 'react'
import { Link } from 'react-router-dom'
import { StateInstrument } from 'storeLocal/apiInstruments'
import { useSelector, useDispatch } from 'react-redux'
import apiClock from 'storeLocal/apiClock'
import apiThisClient from 'storeLocal/apiThisClient'

type OwnProps = { inst: StateInstrument; posId: number }

const InstrumentView: React.FC<OwnProps> = ({ inst, posId }) => {
	const dispatch = useDispatch()
	const togglePaused = () => {
		dispatch(apiClock.paused.toggle())
	}
	const paused = useSelector(apiClock.paused.select)
	const isAudioPlayer = useSelector(apiThisClient.isAudioPlayer.select)

	let extra: React.ReactNode | null = null
	let extra2: React.ReactNode | null = null
	let disabled = false
	switch (true) {
		case inst.subengine === 'video':
			// Video instruments include a link to open the video output in a new tab/window
			extra = (
				<>
					{': '}
					<Link
						to={`/video/${inst.id}`}
						target='_blank'
						style={{ color: 'white', textDecoration: 'underline' }}
						title={'Use shift+click to open the video output in a new window'}
						onClick={() => {
							if (!paused) {
								// Work around a bug that causes weirdness (multiple play-points) when a
								// new window is opened while the transport is playing. See related FIXME
								// in Engine.ts#updatePaused
								togglePaused()
							}
						}}
					>
						shift+click to open
					</Link>
				</>
			)
			break
		case !isAudioPlayer && inst.subengine === 'audio':
			extra = 'disabled'
			extra2 = '[Close all other tabs and reload this page to re-enable]'
			disabled = true
			break
	}

	const marginVert = '20px'
	const marginHoriz = '15px'
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				flex: 1,
				padding: '10px',
				marginTop: 0,
				marginBottom: marginVert,
				marginLeft: posId === 0 ? marginHoriz : 0,
				marginRight: marginHoriz,
				backgroundColor: disabled ? '#333' : '#444',
				color: disabled ? '#888' : 'white',
			}}
		>
			<div>
				<b key='name'>{inst.name}</b> ({inst.subengine}
				{extra ? extra : null})
				{extra2
					? [<div style={{ marginTop: '5pt', fontSize: '10pt', color: '#EEE' }}>{extra2}</div>]
					: null}
			</div>
		</div>
	)
}

export default InstrumentView
