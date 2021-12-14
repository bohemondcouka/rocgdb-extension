import { DebugAdapterTracker, Event, DebugSession, EventEmitter, DebugAdapterTrackerFactory } from 'vscode';

export interface Observer {
	getData(session: DebugSession): void;
	cleanData(session: DebugSession): void;
}

export class EventStoppedListenerFactory implements DebugAdapterTrackerFactory {

	
	constructor(private observers: Observer[]) {

	}

	createDebugAdapterTracker(session: DebugSession): DebugAdapterTracker {
		const listener =  new EventStoppedListener(session);
		this.observers.forEach(observer => {
			listener.onStopped(session => observer.getData(session));
			listener.onExited((session) => observer.cleanData(session));
		});
		return listener;
	}
	
}

export class EventStoppedListener implements DebugAdapterTracker {
	public onStopped: Event<DebugSession>;
	private emitterStopped: EventEmitter<DebugSession>;
	public onExited: Event<DebugSession>;
	private emitterExited: EventEmitter<DebugSession>;

	constructor(public readonly session: DebugSession){
		this.emitterStopped = new EventEmitter();
		this.onStopped = this.emitterStopped.event;
		this.emitterExited = new EventEmitter();
		this.onExited = this.emitterExited.event;
	}
	/**
	 * A session with the debug adapter is about to be started.
	 */
	onWillStartSession(): void {
	}
	/**
	 * The debug adapter is about to receive a Debug Adapter Protocol message from the editor.
	 */
	onWillReceiveMessage(message: any): void {
	}
	/**
	 * The debug adapter has sent a Debug Adapter Protocol message to the editor.
	 */
	onDidSendMessage(message: any): void {
		if(message.type !== 'event') return;
		if(message.event !== 'stopped') return;
		this.emitterStopped.fire(this.session);

	}
	/**
	 * The debug adapter session is about to be stopped.
	 */
	onWillStopSession(): void {
	}
	/**
	 * An error with the debug adapter has occurred.
	 */
	onError(error: Error): void {
		console.debug(`Debug session error : error (${error})`);
	}
	/**
	 * The debug adapter has exited with the given exit code or signal.
	 */
	onExit(code: number | undefined, signal: string | undefined): void {
		this.emitterStopped.fire(this.session);
		console.debug(`Debug session end : code (${code}), signal (${signal})`);
	}
}