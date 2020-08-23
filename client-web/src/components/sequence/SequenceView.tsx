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
	// <h4 style={{ transform: 'rotate(-90deg)' }}>{seq.name}</h4>
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'row',
				flex: 1,
			}}
		>
			<h4
				style={{
					display: 'flex',
					padding: '1rem',
					color: 'white',
					fontWeight: 'bold',
				}}
			>
				{seq.name}
			</h4>
			<div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>{steps}</div>
		</div>
	)
}
export default SequenceView
