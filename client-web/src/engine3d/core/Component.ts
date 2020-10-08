import { drawFunc, Obj } from './Obj'

export class Component {
	parent: Obj
	drawDebug?: drawFunc

	constructor(parent: Obj) {
		this.parent = parent
	}

	destroy() {
		console.log('[Component] destroyed')
	}

	update(_dt: number) {
		console.warn('[Component] update')
	}
}
