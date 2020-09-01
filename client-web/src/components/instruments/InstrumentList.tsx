import React from 'react'
import { useSelector } from 'react-redux'
import apiInstruments from 'storeLocal/apiInstruments'
import InstrumentView from './InstrumentView'

const InstrumentList: React.FC = () => {
	const instruments = useSelector(apiInstruments.selectAll)

	const instViews: React.ReactNode[] = []
	for (let ii = 0; ii < instruments.length; ii++) {
		const inst = instruments[ii]
		instViews.push(<InstrumentView inst={inst} key={`inst-${inst.id}`} posId={ii} />)
	}
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: '#222',
				margin: '0 10px 20px 10px',
			}}
		>
			<h5 style={{ margin: '10px 15px', color: '#CCC', fontWeight: 'bold' }}>Instruments</h5>
			<div style={{ display: 'flex', flex: 1, flexDirection: 'row' }}>{instViews}</div>
		</div>
	)
}

export default InstrumentList
