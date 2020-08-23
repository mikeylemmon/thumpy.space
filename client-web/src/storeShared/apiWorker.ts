import { PayloadAction } from '@reduxjs/toolkit'
import { StateShared } from './reducerShared'
import { LocalClient } from './sliceLocalClients'

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

function proxyMsgAction(action: PayloadAction): ProxyMsgAction {
	return {
		kind: ProxyMsgKind.Action,
		data: { action },
	}
}

export const proxyMsg = {
	action: proxyMsgAction,
}

//
// Worker messages are sent from the worker to the client
//
export enum WorkerMsgKind {
	Connected = 'connected',
	Action = 'action',
}
export type WorkerMsgConnectedData = { localClient: LocalClient; rootState: StateShared }
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

function workerMsgConnected(lc: LocalClient, rootState: StateShared): WorkerMsgConnected {
	return {
		kind: WorkerMsgKind.Connected,
		data: { localClient: lc, rootState },
	}
}

function workerMsgAction(action: PayloadAction): WorkerMsgAction {
	return {
		kind: WorkerMsgKind.Action,
		data: { action },
	}
}

export const workerMsg = {
	action: workerMsgAction,
	connected: workerMsgConnected,
}
