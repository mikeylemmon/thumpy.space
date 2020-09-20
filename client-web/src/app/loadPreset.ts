import { Dispatch } from 'redux'
import apiInstruments from 'storeLocal/apiInstruments'
import apiSequences, { Step } from 'storeLocal/apiSequences'
import Haunted from 'engine/audio/Haunted'
import Tappy from 'engine/audio/Tappy'
import Puddleish, { TriggerDropsId, TriggerWeatherId } from 'engine/video/Puddleish'

const numSteps = 16
const emptySteps = (): Step[] => {
	const steps: Step[] = []
	for (let ii = 0; ii < numSteps; ii++) {
		steps.push({ id: ii, triggers: [] })
	}
	return steps
}

const hauntedSteps = (): Step[] => emptySteps()
// 	{ id: 0, triggers: [{ freq: 45, unit: 'midi', dur: '8n' }] },
// 	{ id: 1, triggers: [{ freq: 48, unit: 'midi', dur: '8n' }] },
// 	{ id: 2, triggers: [{ freq: 52, unit: 'midi', dur: '8n' }] },
// 	{ id: 3, triggers: [{ freq: 45, unit: 'midi', dur: '8n' }] },
// 	{ id: 4, triggers: [{ freq: 48, unit: 'midi', dur: '8n' }] },
// 	{ id: 5, triggers: [{ freq: 52, unit: 'midi', dur: '8n' }] },
// 	{ id: 6, triggers: [{ freq: 46, unit: 'midi', dur: '8n' }] },
// 	{ id: 7, triggers: [{ freq: 50, unit: 'midi', dur: '8n' }] },
// 	{ id: 8, triggers: [{ freq: 45, unit: 'midi', dur: '8n' }] },
// 	{ id: 9, triggers: [{ freq: 48, unit: 'midi', dur: '8n' }] },
// 	{ id: 10, triggers: [{ freq: 52, unit: 'midi', dur: '8n' }] },
// 	{ id: 11, triggers: [{ freq: 45, unit: 'midi', dur: '8n' }] },
// 	{ id: 12, triggers: [{ freq: 48, unit: 'midi', dur: '8n' }] },
// 	{ id: 13, triggers: [{ freq: 52, unit: 'midi', dur: '8n' }] },
// 	{ id: 14, triggers: [{ freq: 46, unit: 'midi', dur: '8n' }] },
// 	{ id: 15, triggers: [{ freq: 50, unit: 'midi', dur: '8n' }] },
// ]

const tappySteps = (): Step[] => [
	{
		id: 0,
		triggers: [
			{ freq: 46, unit: 'midi', dur: '8n' },
			{ freq: 51, unit: 'midi', dur: '8n' },
		],
	},
	{
		id: 1,
		triggers: [
			{ freq: 48, unit: 'midi', dur: '8n' },
			{ freq: 50, unit: 'midi', dur: '8n' },
		],
	},
	{
		id: 2,
		triggers: [
			{ freq: 47, unit: 'midi', dur: '8n' },
			{ freq: 51, unit: 'midi', dur: '8n' },
		],
	},
	{
		id: 3,
		triggers: [
			{ freq: 45, unit: 'midi', dur: '8n' },
			{ freq: 51, unit: 'midi', dur: '8n' },
		],
	},
	{
		id: 4,
		triggers: [
			{ freq: 45, unit: 'midi', dur: '8n' },
			{ freq: 50, unit: 'midi', dur: '8n' },
		],
	},
	{ id: 5, triggers: [{ freq: 50, unit: 'midi', dur: '8n' }] },
	{
		id: 6,
		triggers: [
			{ freq: 49, unit: 'midi', dur: '8n' },
			{ freq: 51, unit: 'midi', dur: '8n' },
		],
	},
	{
		id: 7,
		triggers: [
			{ freq: 47, unit: 'midi', dur: '8n' },
			{ freq: 50, unit: 'midi', dur: '8n' },
		],
	},
	{
		id: 8,
		triggers: [
			{ freq: 46, unit: 'midi', dur: '8n' },
			{ freq: 50, unit: 'midi', dur: '8n' },
		],
	},
	{
		id: 9,
		triggers: [
			{ freq: 48, unit: 'midi', dur: '8n' },
			{ freq: 50, unit: 'midi', dur: '8n' },
		],
	},
	{ id: 10, triggers: [{ freq: 51, unit: 'midi', dur: '8n' }] },
	{
		id: 11,
		triggers: [
			{ freq: 47, unit: 'midi', dur: '8n' },
			{ freq: 51, unit: 'midi', dur: '8n' },
		],
	},
	{
		id: 12,
		triggers: [
			{ freq: 46, unit: 'midi', dur: '8n' },
			{ freq: 50, unit: 'midi', dur: '8n' },
		],
	},
	{ id: 13, triggers: [{ freq: 50, unit: 'midi', dur: '8n' }] },
	{
		id: 14,
		triggers: [
			{ freq: 52, unit: 'midi', dur: '8n' },
			{ freq: 50, unit: 'midi', dur: '8n' },
		],
	},
	{ id: 15, triggers: [{ freq: 51, unit: 'midi', dur: '8n' }] },
]

// loadPreset uses the provided dispatch function to load the presets into the scene
function loadPreset(dispatch: Dispatch<any>) {
	const haunted = Haunted.StateDefault()
	const tappy = Tappy.StateDefault()
	const puddleish = Puddleish.StateDefault()
	puddleish.name = 'Visualizer'

	dispatch(apiInstruments.addOne(haunted))
	dispatch(apiInstruments.addOne(tappy))
	dispatch(apiInstruments.addOne(puddleish))

	// Add a default sequence since we're the audio player and none exists yet
	dispatch(
		apiSequences.addOne({
			id: 'seq-1',
			name: 'Synth Loop',
			steps: hauntedSteps(),
			outputs: [
				{
					instrumentId: haunted.id,
					inputId: Haunted.StateInputs()[0].id,
				},
				{
					instrumentId: puddleish.id,
					inputId: TriggerDropsId,
				},
			],
			currentStep: -1,
		}),
	)

	dispatch(
		apiSequences.addOne({
			id: 'seq-2',
			name: 'Tappy Loop',
			steps: tappySteps(),
			outputs: [
				{
					instrumentId: tappy.id,
					inputId: Tappy.StateInputs()[0].id,
				},
				{
					instrumentId: puddleish.id,
					inputId: TriggerWeatherId,
				},
			],
			currentStep: -1,
		}),
	)
}

export default loadPreset
