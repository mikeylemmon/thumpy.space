import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import apiSequences from 'storeLocal/apiSequences'
import apiThisClient from 'storeLocal/apiThisClient'
import SequenceView from './SequenceView'

import loadPreset from 'app/loadPreset'

const SequenceList: React.FC = () => {
	const dispatch = useDispatch()
	const sequences = useSelector(apiSequences.selectAll)
	const isAudioPlayer = useSelector(apiThisClient.isAudioPlayer.select)

	useEffect(() => {
		if (!isAudioPlayer || sequences.length > 0) {
			// Don't load the presets if we're not the first tab opened or if
			// there are aleady sequences in state
			return
		}
		loadPreset(dispatch)
	})

	const seqViews: React.ReactNode[] = []
	for (let ii = 0; ii < sequences.length; ii++) {
		const seq = sequences[ii]
		seqViews.push(<SequenceView seq={seq} key={`seq-${seq.id}`} posId={ii} />)
	}
	return (
		<div style={{ display: 'flex', flex: 1, flexDirection: 'row' }}>
			<div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>{seqViews}</div>
		</div>
	)
}

export default SequenceList
