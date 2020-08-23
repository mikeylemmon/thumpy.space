import { PayloadAction } from '@reduxjs/toolkit'
import { StateShared } from './reducerShared'
import { Client } from './sliceClients'

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
export type WorkerMsgConnectedData = { client: Client; stateShared: StateShared }
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

function workerMsgConnected(client: Client, stateShared: StateShared): WorkerMsgConnected {
	return {
		kind: WorkerMsgKind.Connected,
		data: { client, stateShared },
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
