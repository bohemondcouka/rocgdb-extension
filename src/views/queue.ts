import { ExtensionContext, window, TreeDataProvider, Event, EventEmitter, DebugSession, 
	TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Observer } from '../eventStoppedListener';

export interface QueueContents {
    id: string;
    'target-id': string;
    type: string;
    read: string; // optional
    write: string; // optional
    size: string;
    addr: string;
}

export class QueueView {
	public queues: QueueViewProvider;
	public context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.context = context;
		this.queues = new QueueViewProvider();

		const view = window.createTreeView('rocgdb-view-info-queues', { treeDataProvider: this.queues, showCollapseAll: true });
		context.subscriptions.push(view);
		/*vscode.commands.registerCommand('rocgdb-view-info.reveal', async () => {
			const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
			if (key) {
				await view.reveal({ key }, { focus: true, select: false, expand: true });
			}
		});*/
		
	}
}

class QueueViewProvider implements TreeDataProvider<QueueItem | QueueInfo>, Observer {
	public queuesList : QueueItem[];
	public onDidChangeTreeData: Event<QueueItem | undefined>;
	private emitterDidChangeTreeData: EventEmitter<QueueItem |undefined>;

	constructor() {
		this.queuesList = [];
		this.emitterDidChangeTreeData = new EventEmitter<QueueItem |undefined>();
		this.onDidChangeTreeData = this.emitterDidChangeTreeData.event;

	}

	getTreeItem(element: QueueItem | QueueInfo): Thenable<QueueItem | QueueInfo> {
		return Promise.resolve(element);
	}

	getChildren(element?: QueueItem): QueueItem[]  | QueueInfo[] {
		if(element === undefined) return this.queuesList;
		return element.getInfo();
	}

	async getData(session: DebugSession) {
		console.debug('Get Queue Data');
		try {
			
			const result = await session.customRequest('cdt-gdb-adapter/Queues') as QueueContents[];
			if(result) {
				this.queuesList = result.map((data) => new QueueItem(data));
				console.dir(this.queuesList);
				this.emitterDidChangeTreeData.fire(undefined);
				
			}
		} catch (err: any) {
			console.error(err.message);
		}
		

	}


}

class QueueItem extends TreeItem {
	constructor(
		public queue: QueueContents
	) {
		super(queue.id, TreeItemCollapsibleState.Collapsed);

		this.tooltip = queue.type;
		this.description = queue.addr;
		this.contextValue = queue.size;


	}

	getInfo(): QueueInfo[] {
		let result = [
			new QueueInfo('id', this.queue.id),
			new QueueInfo('type', this.queue.type),
			new QueueInfo('addr', this.queue.addr),
			new QueueInfo('size', this.queue.size),
			new QueueInfo('target-id', this.queue['target-id']),
			new QueueInfo('read', this.queue.read),
			new QueueInfo('write', this.queue.write)
		];
		return result;
	}


}

class QueueInfo extends TreeItem {
	constructor(
		public label: string,
		public info: string
	) {
		super(label, TreeItemCollapsibleState.None);
		this.description = info;
	}
}