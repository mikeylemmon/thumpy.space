import React from 'react'
import { useDispatch } from 'react-redux'
import apiSequences, { Step, Trigger } from 'storeLocal/apiSequences'

type OwnProps = {
	isCurrentStep: boolean
	seqId: string
	step: Step
	stepId: number
}

const StepView: React.FC<OwnProps> = ({ isCurrentStep, seqId, step, stepId }) => {
	const dispatch = useDispatch()
	const trigs: React.ReactNode[] = []
	const rows = 8
	for (let ii = 0; ii < rows; ii++) {
		const freq = 52 - ii
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
		const hue = ((ii - 0.4) * 360.0) / 8
		const sat = isOn ? 60 : 0
		let lgt = 62 * (isOn ? 0.9 : 0.45)
		if (isCurrentStep) {
			lgt *= isOn ? 1.5 : 1.3
		}
		const colA = `hsl(${hue}deg, ${sat}%, ${lgt}%)`
		const style: any = {
			marginLeft: stepId === 0 ? 0 : stepId % 4 === 0 ? '6px' : 0,
			borderLeft: stepId === 0 ? 0 : stepId % 4 === 0 ? 0 : '2px solid #333',
			borderTop: ii === 0 ? 0 : '2px solid #333',
			flex: 1,
			display: 'flex',
			backgroundColor: colA,
			cursor: 'pointer',
		}
		if (isOn) {
			const satI = isOn ? 30 : 0
			const lgtI = isCurrentStep ? 27 : 23
			const colI = `hsl(${hue}deg, ${satI}%, ${lgtI}%)`
			style.boxShadow = `inset 0 0 10px ${colI}`
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
