import { PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'app/rootReducer'
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
	Sync = 'sync',
}
export type WorkerMsgConnectedData = { localClient: LocalClient }
export type WorkerMsgConnected = {
	kind: WorkerMsgKind.Connected
	data: WorkerMsgConnectedData
}
export type SyncMeta = { sync: boolean; rootState: RootState }
export type SyncAction = PayloadAction<any, string, SyncMeta>
export type WorkerMsgSyncData = { action: SyncAction }
export type WorkerMsgSync = {
	kind: WorkerMsgKind.Sync
	data: WorkerMsgSyncData
}
export type WorkerMsg = WorkerMsgConnected | WorkerMsgSync
export function workerMsgConnected(lc: LocalClient): WorkerMsgConnected {
	return {
		kind: WorkerMsgKind.Connected,
		data: { localClient: lc },
	}
}
export function workerMsgSync(action: PayloadAction, rootState: RootState): WorkerMsgSync {
	return {
		kind: WorkerMsgKind.Sync,
		data: { action: { ...action, meta: { sync: true, rootState } } },
	}
}
