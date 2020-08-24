import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import apiSequences, { Step } from 'storeLocal/apiSequences'
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
		const emptySteps = (): Step[] => {
			const steps: Step[] = []
			for (let ii = 0; ii < 16; ii++) {
				steps.push({ triggers: [] })
			}
			return steps
		}
		dispatch(
			apiSequences.addOne({
				id: 'seq-1',
				name: 'Sequence 1',
				steps: emptySteps(),
			}),
		)
		dispatch(
			apiSequences.addOne({
				id: 'seq-2',
				name: 'Sequence 2',
				steps: emptySteps(),
			}),
		)
	})

	// const seqViews = sequences.map(seq => <SequenceView key={seq.id} sequence={seq} />)
	const seqViews: React.ReactNode[] = []
	for (let ii = 0; ii < sequences.length; ii++) {
		const seq = sequences[ii]
		seqViews.push(<SequenceView seq={seq} key={`seq-${seq.id}`} posId={ii} />)
	}
	return <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>{seqViews}</div>
}

export default SequenceList
