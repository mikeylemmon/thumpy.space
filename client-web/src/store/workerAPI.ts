import { PayloadAction } from '@reduxjs/toolkit'
import { RootState } from './rootReducer'
import { LocalClient } from './localClientsSlice'

//
// Proxy messages are sent from the client to the worker
//
export enum ProxyMsgKind {
	Action = 'action',
}
export type ProxyMsgActionData = { action: PayloadAction }
export type ProxyMsgAction = {
	kind: ProxyMsgKind.Action
	data: ProxyMsgActionData
}
export type ProxyMsg = ProxyMsgAction
export function proxyMsgAction(action: PayloadAction): ProxyMsgAction {
	return {
		kind: ProxyMsgKind.Action,
		data: { action },
	}
}

//
// Worker messages are sent from the worker to the client
//
export enum WorkerMsgKind {
	Connected = 'connected',
	Action = 'action',
}
export type WorkerMsgConnectedData = { localClient: LocalClient; rootState: RootState }
export type WorkerMsgConnected = {
	kind: WorkerMsgKind.Connected
	data: WorkerMsgConnectedData
}
export type WorkerMsgActionData = { action: PayloadAction }
export type WorkerMsgAction = {
	kind: WorkerMsgKind.Action
	data: WorkerMsgActionData
}
export type WorkerMsg = WorkerMsgConnected | WorkerMsgAction
export function workerMsgConnected(lc: LocalClient, rootState: RootState): WorkerMsgConnected {
	return {
		kind: WorkerMsgKind.Connected,
		data: { localClient: lc, rootState },
	}
}
export function workerMsgAction(action: PayloadAction): WorkerMsgAction {
	return {
		kind: WorkerMsgKind.Action,
		data: { action },
	}
}
