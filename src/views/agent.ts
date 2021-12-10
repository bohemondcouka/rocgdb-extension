import * as vscode from 'vscode';

export class AgentView {
	constructor(context: vscode.ExtensionContext) {
		const view = vscode.window.createTreeView('rocgdb-view-info-agents', { treeDataProvider: new AgentViewProvider(), showCollapseAll: true });
		context.subscriptions.push(view);
		/*vscode.commands.registerCommand('rocgdb-view-info.reveal', async () => {
			const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
			if (key) {
				await view.reveal({ key }, { focus: true, select: false, expand: true });
			}
		});*/
		vscode.debug.onDidStartDebugSession(session => {
			if(session.type != 'rocgdb'){
				return;
			}
			console.log('Yeah !');
		})
		vscode.debug.registerDebugAdapterTrackerFactory('rocgdb', new AgentListenerFactory());
	}
}

class AgentListenerFactory implements vscode.DebugAdapterTrackerFactory {
	createDebugAdapterTracker(session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterTracker> {
		return new AgentListener(session);
	}
	
}

class AgentListener implements vscode.DebugAdapterTracker {

	constructor(public readonly session: vscode.DebugSession){

	}
	/**
	 * A session with the debug adapter is about to be started.
	 */
	onWillStartSession(): void {
		console.log(`Debug session start.`);
	}
	/**
	 * The debug adapter is about to receive a Debug Adapter Protocol message from the editor.
	 */
	onWillReceiveMessage(message: any): void {
		console.log(`Debug session receive mesage : ${message}`);
	}
	/**
	 * The debug adapter has sent a Debug Adapter Protocol message to the editor.
	 */
	onDidSendMessage(message: any): void {
		console.log(`Debug session send message : ${message}`);
	}
	/**
	 * The debug adapter session is about to be stopped.
	 */
	onWillStopSession(): void {
		console.log(`Debug session stop.`);
	}
	/**
	 * An error with the debug adapter has occurred.
	 */
	onError(error: Error): void {
		console.log(`Debug session error : error (${error})`);
	}
	/**
	 * The debug adapter has exited with the given exit code or signal.
	 */
	onExit(code: number | undefined, signal: string | undefined): void {
		console.log(`Debug session end : code (${code}), signal (${signal})`);
	}
}

class AgentViewProvider implements vscode.TreeDataProvider<AgentItem> {
	onDidChangeTreeData?: vscode.Event<void | AgentItem | undefined> | undefined;
	getTreeItem(element: AgentItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return new AgentItem('agent-test', vscode.TreeItemCollapsibleState.Collapsed);
	}
	getChildren(element?: AgentItem): vscode.ProviderResult<AgentItem[]> {
		return [new AgentItem('agent-test', vscode.TreeItemCollapsibleState.Collapsed)];
	}

}

class AgentItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);

		this.tooltip = 'agents';
		this.description = 'list of agent';
	}
}