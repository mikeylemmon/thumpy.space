import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import apiSequences from 'storeLocal/apiSequence'
import apiThisClient from 'storeLocal/apiThisClient'
import SequenceView from './SequenceView'

const SequenceList: React.FC = () => {
	const dispatch = useDispatch()
	const sequences = useSelector(apiSequences.selectAll)
	const isAudioPlayer = useSelector(apiThisClient.isAudioPlayer.select)

	useEffect(() => {
		if (!isAudioPlayer || sequences.length > 0) {
			return
		}
		// Add a default sequence since we're the audio player and none exists yet
		dispatch(
			apiSequences.addOne({
				id: 'default-sequence',
				name: 'Default Sequence',
				steps: [[], [], [], [], [], [], [], []],
			}),
		)
	})

	const seqViews = sequences.map(seq => <SequenceView key={seq.id} sequence={seq} />)
	return <div className='Sequences'>{seqViews}</div>
}

export default SequenceList
