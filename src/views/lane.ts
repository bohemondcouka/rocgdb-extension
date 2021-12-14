/* eslint-disable @typescript-eslint/naming-convention */
import { LaneGDBResponse, LaneContents } from 'cdt-gdb-adapter/dist/mi/info';
import { ExtensionContext, window, TreeDataProvider, Event, EventEmitter, DebugSession, 
	TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Observer } from '../eventStoppedListener';
import { FrameItem, FrameTreeType } from './frame';


export class LaneView {
	public lanes: LaneViewProvider;
	public context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.context = context;
		this.lanes = new LaneViewProvider();

		const view = window.createTreeView('rocgdb-view-info-lanes', { treeDataProvider: this.lanes, showCollapseAll: true });
		context.subscriptions.push(view);
		/*vscode.commands.registerCommand('rocgdb-view-info.reveal', async () => {
			const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
			if (key) {
				await view.reveal({ key }, { focus: true, select: false, expand: true });
			}
		});*/
		
	}
}

type Content = LaneItem | LaneInfo | FrameTreeType;

class LaneViewProvider implements TreeDataProvider<Content>, Observer {
	public lanesList : LaneItem[];
	public onDidChangeTreeData: Event<LaneItem | undefined>;
	private emitterDidChangeTreeData: EventEmitter<LaneItem |undefined>;

	constructor() {
		this.lanesList = [];
		this.emitterDidChangeTreeData = new EventEmitter<LaneItem |undefined>();
		this.onDidChangeTreeData = this.emitterDidChangeTreeData.event;

	}

	getTreeItem(element: LaneItem | LaneInfo): Thenable<Content> {
		return Promise.resolve(element);
	}

	getChildren(element?: LaneItem): Content[] {
		if(element === undefined) return this.lanesList;
		return element.getInfo();
	}

	async getData(session: DebugSession) {
		console.debug('Get Lane Data');
		try {
			
			const result = await session.customRequest('cdt-gdb-adapter/Info/Lanes') as LaneGDBResponse;
			if(result) {
				this.lanesList = result.lanes.filter(data => data.id !== undefined).map((data) => new LaneItem(data, data.id === result['current-lane-id']));
				this.emitterDidChangeTreeData.fire(undefined);
				
			}
		} catch (err: any) {
			console.error(err.message);
		}
		

	}

	async cleanData(session: DebugSession) {
		this.lanesList = [];
		this.emitterDidChangeTreeData.fire(undefined);
	}

}

class LaneItem extends TreeItem {
	constructor(
		public lane: LaneContents,
		public highlight: boolean = false
	) {
		super(
			{
				label: lane.gid,
				highlights: (highlight ? [[0, lane.gid.length]] : [])
			},
			highlight ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed
		);

		this.tooltip = lane.id;
		this.description = lane.Active;
		this.contextValue = lane.thread;


	}

	getInfo(): (LaneInfo | FrameItem )[] {
		let result = [
			new LaneInfo('id', this.lane.id),
			new FrameItem(this.lane.frame),
			new LaneInfo('gid', this.lane.gid),
			new LaneInfo('Active', this.lane.Active),
			new LaneInfo('target-id', this.lane['target-id']),
			new LaneInfo('thread', this.lane.thread)
		];
		return result;
	}


}

class LaneInfo extends TreeItem {
	constructor(
		public label: string,
		public info: string
	) {
		super(label, TreeItemCollapsibleState.None);
		this.description = info;
	}
}