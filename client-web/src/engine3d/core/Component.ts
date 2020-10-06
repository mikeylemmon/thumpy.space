import { drawFunc, Obj } from './Obj'

export class Component {
	parent: Obj
	drawDebug?: drawFunc

	constructor(parent: Obj) {
		this.parent = parent
		console.log('[Component] ctor', this)
	}

	destroy = () => {
		console.log('[Component] destroyed')
	}

	update = (kjdt: number) => {
		console.warn('[Component] update')
	}
}
