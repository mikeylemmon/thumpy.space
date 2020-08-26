import React from 'react'
import { useDispatch } from 'react-redux'
import apiSequences, { Step, Trigger } from 'storeLocal/apiSequences'

type OwnProps = {
	seqId: string
	step: Step
	stepId: number
}

const StepView: React.FC<OwnProps> = ({ seqId, step, stepId }) => {
	const dispatch = useDispatch()
	const trigs: React.ReactNode[] = []
	const rows = 8
	for (let ii = 0; ii < rows; ii++) {
		const isSeq1 = seqId === 'seq-1'
		const freq = (isSeq1 ? 52 : 60) - ii * (isSeq1 ? 1 : 4)
		let trig: Trigger = { freq, unit: 'midi', dur: '8n' }
		let toggle = apiSequences.trigger.on
		let isOn = false
		const found = step.triggers.find(tt => tt.freq === freq)
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
		const hue = ((ii - 0.4) * 360.0) / 7
		const colA = `hsl(${hue}deg, ${isOn ? 60 : 0}%, ${62 * (isOn ? 0.9 : 0.5)}%)`
		const colB = `hsl(${hue}deg, ${isOn ? 30 : 0}%, ${25 * (isOn ? 0.9 : 1.7)}%)`
		const style: any = {
			marginLeft: stepId === 0 ? 0 : stepId % 4 === 0 ? '6px' : '2px',
			marginTop: ii === 0 ? 0 : '2px',
			flex: 1,
			display: 'flex',
			backgroundColor: colA,
		}
		if (isOn) {
			style.boxShadow = `inset 0 0 10px ${colB}`
		}
		trigs.push(<div onClick={onClick} style={style} key={`${seqId}-step${stepId}-trig${trig.freq}`} />)
	}
	return (
		<div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#303030' }}>
			{trigs}
		</div>
	)
}
export default StepView
