import React from 'react'
import { Sequence } from 'storeLocal/apiSequence'
import StepView from './StepView'

type OwnProps = { sequence: Sequence }

const SequenceView: React.FC<OwnProps> = ({ sequence: seq }) => {
	const steps: React.ReactNode[] = []
	for (let ii = 0; ii < seq.steps.length; ii++) {
		const step = seq.steps[ii]
		steps.push(<StepView seqId={seq.id} step={step} stepId={ii} key={`${seq.id}-step${ii}`} />)
	}
	return (
		<div
			className='Sequence'
			style={{
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<h4>{seq.name}</h4>
			<div style={{ display: 'flex', flexDirection: 'row' }}>{steps}</div>
		</div>
	)
}
export default SequenceView
