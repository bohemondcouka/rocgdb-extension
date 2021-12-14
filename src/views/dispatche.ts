/* eslint-disable @typescript-eslint/naming-convention */
import { DispatchGDBResponse, DispatchContents } from 'cdt-gdb-adapter/dist/mi/info';
import { ExtensionContext, window, TreeDataProvider, Event, EventEmitter, DebugSession, 
	TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Observer } from '../eventStoppedListener';

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
			
			const result = await session.customRequest('cdt-gdb-adapter/Info/Dispatches') as DispatchGDBResponse;
			if(result) {
				this.dispatchesList = result.dispatches.filter(data => data.id !== undefined).map((data) => new DispatcheItem(data, data.id === result['current-dispatch-id']));
				this.emitterDidChangeTreeData.fire(undefined);
				
			}
		} catch (err: any) {
			console.error(err.message);
		}
		

	}

	async cleanData(session: DebugSession) {
		this.dispatchesList = [];
		this.emitterDidChangeTreeData.fire(undefined);
	}

}

class DispatcheItem extends TreeItem {
	constructor(
		public dispatche: DispatchContents,
		public highlight: boolean = false
	) {
		super(
			{
				label : dispatche.id,
				highlights: (highlight ? [[0, dispatche.id.length]] : [])
			 },
			 highlight ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed
		);

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