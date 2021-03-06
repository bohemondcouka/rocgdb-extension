// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { threadId } from 'worker_threads';
import { EventStoppedListenerFactory } from './eventStoppedListener';
import { AgentView } from './views/agent';
import { DispatcheView } from './views/dispatche';
import { LaneView } from './views/lane';
import { QueueView } from './views/queue';
import { ThreadView } from './views/thread';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "rocgdb-extension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('rocgdb.open', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		//vscode.debug.activeDebugSession?.customRequest('');
		vscode.window.showInformationMessage('Hello World from rocgdb-extension!');
	});
	context.subscriptions.push(
		vscode.commands.registerCommand('rocgdb.debug.askProgramPath', config => {
			return vscode.window.showInputBox({
				placeHolder: "Please enter the path to the program"
			});
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('rocgdb.debug.askProcessId', config => {
			return vscode.window.showInputBox({
				placeHolder: "Please enter ID of process to attach to"
			});
		})
	);

	context.subscriptions.push(disposable);

	const agent = new AgentView(context);
	const queue =new QueueView(context);
	const dispatche = new DispatcheView(context);
	const lane = new LaneView(context);
	const thread = new ThreadView(context);
	const stoppedListener = new EventStoppedListenerFactory([
		agent.agents,
		queue.queues,
		dispatche.dispatches,
		lane.lanes,
		thread.threads
	]);
	vscode.debug.registerDebugAdapterTrackerFactory('rocgdb', stoppedListener);
}

// this method is called when your extension is deactivated
export function deactivate() {}
