/* eslint-disable @typescript-eslint/naming-convention */
import { ThreadGDBResponse, ThreadContents } from 'cdt-gdb-adapter/dist/mi/info';
import { ExtensionContext, window, TreeDataProvider, Event, EventEmitter, DebugSession, 
	TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Observer } from '../eventStoppedListener';
import { FrameTreeType, FrameItem } from './frame';



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
			
			const result = await session.customRequest('cdt-gdb-adapter/Info/Threads') as ThreadGDBResponse;
			if(result) {
				this.threadsList = result.threads.map((data) => new ThreadItem(data, data.id === result['current-thread-id']));
				this.emitterDidChangeTreeData.fire(undefined);
				
			}
		} catch (err: any) {
			console.error(err.message);
		}
		

	}

	async cleanData(session: DebugSession) {
		this.threadsList = [];
		this.emitterDidChangeTreeData.fire(undefined);
	}


}

class ThreadItem extends TreeItem {
	constructor(
		public thread: ThreadContents,
		public highlight: boolean = false
	) {
		super(
			{
				label: thread['target-id'],
				highlights: (highlight ? [[0,thread['target-id'].length]] : [])
			},
			highlight ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed
		);

		this.tooltip = thread.name;
		this.description = thread.id;
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