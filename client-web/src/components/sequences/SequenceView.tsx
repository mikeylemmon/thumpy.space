import React from 'react'
import { useSelector } from 'react-redux'
import apiSequences, { StateSequence } from 'storeLocal/apiSequences'
import apiClock from 'storeLocal/apiClock'
import StepView from './StepView'

type OwnProps = { seq: StateSequence; posId: number }

const SequenceView: React.FC<OwnProps> = ({ seq, posId }) => {
	const paused = useSelector(apiClock.paused.select)
	const steps: React.ReactNode[] = []
	for (let ii = 0; ii < seq.steps.length; ii++) {
		const step = seq.steps[ii]
		steps.push(
			<StepView
				isCurrentStep={!paused && seq.currentStep === ii}
				seqId={seq.id}
				step={step}
				stepId={ii}
				key={`${seq.id}-step${ii}`}
			/>,
		)
	}
	const selOuts = apiSequences.id(seq.id).outputs.selectAll
	const outputs = useSelector(selOuts)
	const outList: React.ReactNode[] = []
	for (let ii = 0; ii < outputs.length; ii++) {
		const seqOut = outputs[ii]
		const seqOutInst = seqOut.instrument
		const outName = seqOutInst
			? `${seqOutInst.name} (${seqOut.inputId})`
			: `${seqOut.instrumentId} (missing)`
		outList.push(<li key={`${seq.id}-out-${ii}`}>{outName}</li>)
	}
	const marginVert = '20px'
	const marginHoriz = '10px'
	const paddingInfoVert = '20px'
	const paddingInfoHoriz = '20px'
	const outView =
		outputs.length > 0 ? (
			<ul style={{ color: '#DDD', margin: '10px 0', padding: `0 ${paddingInfoHoriz}` }}>{outList}</ul>
		) : (
			'none'
		)
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
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					padding: `${paddingInfoVert} ${paddingInfoHoriz}`,
					width: '160px',
				}}
			>
				<h3 style={{ color: 'white', fontWeight: 'bold' }}>{seq.name}</h3>
				<span style={{ color: '#CCC', fontSize: '9pt' }}>OUTPUTS:</span>
				{outView}
			</div>
			<div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>{steps}</div>
		</div>
	)
}
export default SequenceView
