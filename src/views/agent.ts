
import { ExtensionContext, window, TreeDataProvider, Event, EventEmitter, DebugSession, 
	TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Observer } from '../eventStoppedListener';

export interface AgentContents {
    id: string;
    'target-id': string;
    name: string;
    cores: string,
    threads: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'location_id' : string;
}

export class AgentView {
	public agents: AgentViewProvider;
	public context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.context = context;
		this.agents = new AgentViewProvider();

		const view = window.createTreeView('rocgdb-view-info-agents', { treeDataProvider: this.agents, showCollapseAll: true });
		context.subscriptions.push(view);
		/*vscode.commands.registerCommand('rocgdb-view-info.reveal', async () => {
			const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
			if (key) {
				await view.reveal({ key }, { focus: true, select: false, expand: true });
			}
		});*/
		
	}
}

class AgentViewProvider implements TreeDataProvider<AgentItem | AgentInfo>, Observer {
	public agentsList : AgentItem[];
	public onDidChangeTreeData: Event<AgentItem | undefined>;
	private emitterDidChangeTreeData: EventEmitter<AgentItem |undefined>;

	constructor() {
		this.agentsList = [];
		this.emitterDidChangeTreeData = new EventEmitter<AgentItem |undefined>();
		this.onDidChangeTreeData = this.emitterDidChangeTreeData.event;

	}

	getTreeItem(element: AgentItem | AgentInfo): Thenable<AgentItem | AgentInfo> {
		return Promise.resolve(element);
	}

	getChildren(element?: AgentItem): AgentItem[]  | AgentInfo[] {
		if(element === undefined) return this.agentsList;
		return element.getInfo();
	}

	async getData(session: DebugSession) {
		console.debug('Get Agent Data');
		try {
			
			const result = await session.customRequest('cdt-gdb-adapter/Agents') as AgentContents[];
			if(result) {
				this.agentsList = result.map((data) => new AgentItem(data));
				console.dir(this.agentsList);
				this.emitterDidChangeTreeData.fire(undefined);
				
			}
		} catch (err: any) {
			console.error(err.message);
		}
		

	}


}

class AgentItem extends TreeItem {
	constructor(
		public agent: AgentContents
	) {
		super(agent['target-id'], TreeItemCollapsibleState.Collapsed);

		this.tooltip = agent.name;
		this.description = agent.id;
		this.contextValue = agent.threads;


	}

	getInfo(): AgentInfo[] {
		let result = [
			new AgentInfo('id', this.agent.id),
			new AgentInfo('name', this.agent.name),
			new AgentInfo('location-id', this.agent.location_id),
			new AgentInfo('cores', this.agent.cores),
			new AgentInfo('target-id', this.agent['target-id']),
			new AgentInfo('Threads', this.agent.threads)
		];
		return result;
	}


}

class AgentInfo extends TreeItem {
	constructor(
		public label: string,
		public info: string
	) {
		super(label, TreeItemCollapsibleState.None);
		this.description = info;
	}
}