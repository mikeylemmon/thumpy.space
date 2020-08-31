import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import apiInstruments from 'storeLocal/apiInstruments'
import Casio from 'engine/audio/Casio'
import DrumMachine from 'engine/audio/DrumMachine'
import apiSequences, { Step } from 'storeLocal/apiSequences'
import apiThisClient from 'storeLocal/apiThisClient'
import SequenceView from './SequenceView'

import Circle from 'engine/video/Circle'

const numSteps = 16

const SequenceList: React.FC = () => {
	const dispatch = useDispatch()
	const sequences = useSelector(apiSequences.selectAll)
	const isAudioPlayer = useSelector(apiThisClient.isAudioPlayer.select)
	const circle = Circle.StateDefault()

	useEffect(() => {
		if (!isAudioPlayer || sequences.length > 0) {
			return
		}
		// Add default instruments
		const casio = Casio.StateDefault()
		dispatch(apiInstruments.addOne(casio))
		const dm = DrumMachine.StateDefault()
		dispatch(apiInstruments.addOne(dm))
		dispatch(apiInstruments.addOne(circle))

		// Add a default sequence since we're the audio player and none exists yet
		const emptySteps = (): Step[] => {
			const steps: Step[] = []
			for (let ii = 0; ii < numSteps; ii++) {
				steps.push({ id: ii, triggers: [] })
			}
			return steps
		}
		dispatch(
			apiSequences.addOne({
				id: 'seq-1',
				name: 'Casio',
				steps: emptySteps(),
				outputs: [
					{
						instrumentId: casio.id,
						inputId: Casio.StateInputs()[0].id,
					},
					{
						instrumentId: circle.id,
						inputId: Circle.StateInputs()[0].id,
					},
				],
				currentStep: 0,
			}),
		)
		dispatch(
			apiSequences.addOne({
				id: 'seq-2',
				name: 'Kick',
				steps: emptySteps(),
				outputs: [
					{
						instrumentId: dm.id,
						inputId: DrumMachine.StateInputs()[0].id,
					},
				],
				currentStep: 0,
			}),
		)
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
