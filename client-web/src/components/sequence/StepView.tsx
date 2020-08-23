import React from 'react'
import { useDispatch } from 'react-redux'
import apiSequences, { Step, Trigger } from 'storeLocal/apiSequence'

type OwnProps = {
	seqId: string
	step: Step
	stepId: number
}

const StepView: React.FC<OwnProps> = ({ seqId, step, stepId }) => {
	const dispatch = useDispatch()
	const trigs: React.ReactNode[] = []
	for (let ii = 0; ii < 4; ii++) {
		const freq = 52 + ii
		let trig: Trigger = { freq, unit: 'midi', dur: '8n' }
		let toggle = apiSequences.trigger.on
		let isOn = false
		const found = step.find(tt => tt.freq === freq)
		if (found) {
			trig = found
			toggle = apiSequences.trigger.off
			isOn = true
		}
		const onClick = () =>
			dispatch(
				toggle({
					seqId,
					stepId,
					trigger: trig,
				}),
			)
		trigs.push(
			<div
				onClick={onClick}
				style={{
					padding: 20,
					margin: 5,
					backgroundColor: isOn ? 'green' : 'gray',
				}}
				key={`${seqId}-step${stepId}-trig${trig.freq}`}
			/>,
		)
	}
	return <div>{trigs}</div>
}
export default StepView
