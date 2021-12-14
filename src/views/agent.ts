
import { AgentGDBResponse, AgentContents } from 'cdt-gdb-adapter/dist/mi/info';
import { ExtensionContext, window, TreeDataProvider, Event, EventEmitter, DebugSession, 
	TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Observer } from '../eventStoppedListener';

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
			
			const result = await session.customRequest('cdt-gdb-adapter/Info/Agents') as AgentGDBResponse;
			if(result) {
				this.agentsList = result.agents.filter(data => data.id !== undefined).map((data) => new AgentItem(data, data.id === result['current-agent-id']));
				this.emitterDidChangeTreeData.fire(undefined);
				
			}
		} catch (err: any) {
			console.error(err.message);
		}
		

	}

	async cleanData(session: DebugSession) {
		console.debug('cleanData');
		this.agentsList = [];
		this.emitterDidChangeTreeData.fire(undefined);
	}

}

class AgentItem extends TreeItem {
	constructor(
		public agent: AgentContents,
		public highlight: boolean = false
	) {
		super(
			{
				label: agent['target-id'],
				highlights: (highlight ? [[0, agent['target-id'].length]] : [])
			},
			highlight ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed
		);

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