import React from 'react'
import { StateSequence } from 'storeLocal/apiSequences'
import StepView from './StepView'

type OwnProps = { seq: StateSequence; posId: number }

const SequenceView: React.FC<OwnProps> = ({ seq, posId }) => {
	const steps: React.ReactNode[] = []
	for (let ii = 0; ii < seq.steps.length; ii++) {
		const step = seq.steps[ii]
		steps.push(
			<StepView
				currentStep={seq.currentStep}
				seqId={seq.id}
				step={step}
				stepId={ii}
				key={`${seq.id}-step${ii}`}
			/>,
		)
	}
	const marginVert = '20px'
	const marginHoriz = '10px'
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'row',
				flex: 1,
				marginTop: posId === 0 ? marginVert : 0,
				marginBottom: marginVert,
				marginLeft: marginHoriz,
				marginRight: marginHoriz,
				backgroundColor: '#222',
			}}
		>
			<h4
				style={{
					display: 'flex',
					padding: '1rem',
					color: 'white',
					fontWeight: 'bold',
					width: '6rem',
				}}
			>
				{seq.name}
			</h4>
			<div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>{steps}</div>
		</div>
	)
}
export default SequenceView
