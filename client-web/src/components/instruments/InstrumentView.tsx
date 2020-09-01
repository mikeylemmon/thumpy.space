import React from 'react'
import { Link } from 'react-router-dom'
import { StateInstrument } from 'storeLocal/apiInstruments'

type OwnProps = { inst: StateInstrument; posId: number }

const InstrumentView: React.FC<OwnProps> = ({ inst, posId }) => {
	const marginVert = '20px'
	const marginHoriz = '15px'
	let link: React.ReactNode | null = null
	if (inst.subengine === 'video') {
		link = (
			<Link
				to={`/video/${inst.id}`}
				target='_blank'
				style={{ color: 'white', textDecoration: 'underline' }}
				title={'Use shift+click to open the video output in a new window'}
			>
				shift+click to open
			</Link>
		)
	}
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				flex: 1,
				// alignItems: 'stretch',
				// marginTop: posId === 0 ? marginVert : 0,
				padding: '10px',
				// marginTop: marginVert,
				marginTop: 0,
				marginBottom: marginVert,
				marginLeft: posId === 0 ? marginHoriz : 0,
				// marginLeft: marginHoriz,
				marginRight: marginHoriz,
				backgroundColor: '#444',
				color: 'white',
			}}
		>
			<div>
				<b>{inst.name}</b> ({inst.subengine}
				{link ? [': ', link] : null})
			</div>
		</div>
	)
	// <pre>{JSON.stringify(inst, null, 4)}</pre>
}
export default InstrumentView
