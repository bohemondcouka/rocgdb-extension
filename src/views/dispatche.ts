/* eslint-disable @typescript-eslint/naming-convention */
import { ExtensionContext, window, TreeDataProvider, Event, EventEmitter, DebugSession, 
	TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Observer } from '../eventStoppedListener';

export interface DispatcheContents {
    id: string;
    'target-id': string;
    grid: string;
    workgroup: string;
    fence: string;
    'address-spaces': string;
    'kernel-desc': string;
    'kernel-args': string;
    'completion': string;
    'kernel-function': string;
}

export class DispatcheView {
	public dispatches: DispatcheViewProvider;
	public context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.context = context;
		this.dispatches = new DispatcheViewProvider();

		const view = window.createTreeView('rocgdb-view-info-dispatches', { treeDataProvider: this.dispatches, showCollapseAll: true });
		context.subscriptions.push(view);
		/*vscode.commands.registerCommand('rocgdb-view-info.reveal', async () => {
			const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
			if (key) {
				await view.reveal({ key }, { focus: true, select: false, expand: true });
			}
		});*/
		
	}
}

class DispatcheViewProvider implements TreeDataProvider<DispatcheItem | DispatcheInfo>, Observer {
	public dispatchesList : DispatcheItem[];
	public onDidChangeTreeData: Event<DispatcheItem | undefined>;
	private emitterDidChangeTreeData: EventEmitter<DispatcheItem |undefined>;

	constructor() {
		this.dispatchesList = [];
		this.emitterDidChangeTreeData = new EventEmitter<DispatcheItem |undefined>();
		this.onDidChangeTreeData = this.emitterDidChangeTreeData.event;

	}

	getTreeItem(element: DispatcheItem | DispatcheInfo): Thenable<DispatcheItem | DispatcheInfo> {
		return Promise.resolve(element);
	}

	getChildren(element?: DispatcheItem): DispatcheItem[]  | DispatcheInfo[] {
		if(element === undefined) return this.dispatchesList;
		return element.getInfo();
	}

	async getData(session: DebugSession) {
		console.debug('Get Dispatche Data');
		try {
			
			const result = await session.customRequest('cdt-gdb-adapter/Dispatches') as DispatcheContents[];
			if(result) {
				this.dispatchesList = result.map((data) => new DispatcheItem(data));
				console.dir(this.dispatchesList);
				this.emitterDidChangeTreeData.fire(undefined);
				
			}
		} catch (err: any) {
			console.error(err.message);
		}
		

	}


}

class DispatcheItem extends TreeItem {
	constructor(
		public dispatche: DispatcheContents
	) {
		super(dispatche.id, TreeItemCollapsibleState.Collapsed);

		this.tooltip = dispatche['target-id'];
		this.description = dispatche.workgroup;
		this.contextValue = dispatche.grid;


	}

	getInfo(): DispatcheInfo[] {
		let result = [
			new DispatcheInfo('id', this.dispatche.id),
			new DispatcheInfo('grid', this.dispatche.grid),
			new DispatcheInfo('workgroup', this.dispatche.workgroup),
			new DispatcheInfo('address-spaces', this.dispatche['address-spaces']),
			new DispatcheInfo('target-id', this.dispatche['target-id']),
			new DispatcheInfo('fence', this.dispatche.fence),
			new DispatcheInfo('completion', this.dispatche.completion),
			new DispatcheInfo('kernel-args', this.dispatche['kernel-args']),
			new DispatcheInfo('kernel-desc', this.dispatche['kernel-desc']),
			new DispatcheInfo('kernel-function', this.dispatche['kernel-function'])
		];
		return result;
	}


}

class DispatcheInfo extends TreeItem {
	constructor(
		public label: string,
		public info: string
	) {
		super(label, TreeItemCollapsibleState.None);
		this.description = info;
	}
}