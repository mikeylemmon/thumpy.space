import { Obj } from './Obj'

export class Component {
	parent: Obj
	constructor(parent: Obj) {
		this.parent = parent
		console.log('[Component] ctor', this)
	}
	destroy = () => {
		console.log('[Component] destroyed')
	}
	update = () => {
		console.warn('[Component] update')
	}
}
