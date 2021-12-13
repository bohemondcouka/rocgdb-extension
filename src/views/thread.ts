/* eslint-disable @typescript-eslint/naming-convention */
import { ExtensionContext, window, TreeDataProvider, Event, EventEmitter, DebugSession, 
	TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Observer } from '../eventStoppedListener';
import { FrameTreeType, FrameContents, FrameItem } from './frame';



export interface ThreadContents {
    id: string;
    'target-id': string;
    name: string;
    frame: FrameContents;
    state: string;
    core: string; // optional
}

export class ThreadView {
	public threads: ThreadViewProvider;
	public context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.context = context;
		this.threads = new ThreadViewProvider();

		const view = window.createTreeView('rocgdb-view-info-threads', { treeDataProvider: this.threads, showCollapseAll: true });
		context.subscriptions.push(view);
		/*vscode.commands.registerCommand('rocgdb-view-info.reveal', async () => {
			const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
			if (key) {
				await view.reveal({ key }, { focus: true, select: false, expand: true });
			}
		});*/
		
	}
}
type Content = ThreadItem | ThreadInfo | FrameTreeType;

class ThreadViewProvider implements TreeDataProvider<Content>, Observer {
	public threadsList : ThreadItem[];
	public onDidChangeTreeData: Event<ThreadItem | undefined>;
	private emitterDidChangeTreeData: EventEmitter<ThreadItem |undefined>;

	constructor() {
		this.threadsList = [];
		this.emitterDidChangeTreeData = new EventEmitter<ThreadItem |undefined>();
		this.onDidChangeTreeData = this.emitterDidChangeTreeData.event;

	}

	getTreeItem(element: ThreadItem | ThreadInfo): Thenable<ThreadItem | ThreadInfo> {
		return Promise.resolve(element);
	}

	getChildren(element?: ThreadItem): Content[] {
		if(element === undefined) return this.threadsList;
		return element.getInfo();
	}

	async getData(session: DebugSession) {
		console.debug('Get Thread Data');
		try {
			
			const result = await session.customRequest('cdt-gdb-adapter/Threads') as ThreadContents[];
			if(result) {
				this.threadsList = result.map((data) => new ThreadItem(data));
				console.dir(this.threadsList);
				this.emitterDidChangeTreeData.fire(undefined);
				
			}
		} catch (err: any) {
			console.error(err.message);
		}
		

	}


}

class ThreadItem extends TreeItem {
	constructor(
		public thread: ThreadContents
	) {
		super(thread['target-id'], TreeItemCollapsibleState.Collapsed);

		this.tooltip = thread.name;
		this.description = thread.core;
		this.contextValue = thread.state;


	}

	getInfo(): (ThreadInfo | FrameItem)[] {
		let result = [
			new ThreadInfo('id', this.thread.id),
			new ThreadInfo('name', this.thread.name),
			new FrameItem(this.thread.frame),
			new ThreadInfo('core', this.thread.core),
			new ThreadInfo('target-id', this.thread['target-id']),
			new ThreadInfo('state', this.thread.state)
		];
		return result;
	}


}

class ThreadInfo extends TreeItem {
	constructor(
		public label: string,
		public info: string
	) {
		super(label, TreeItemCollapsibleState.None);
		this.description = info;
	}
}