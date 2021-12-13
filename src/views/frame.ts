import { TreeItem, TreeItemCollapsibleState } from "vscode";


export type FrameTreeType = FrameInfo | FrameItem | VariableInfo | VariableItem;
/**
 * Variable interface.
 */
 interface VariableContents {
    name: string;
    value: string;
}

/**
 * Frame interface.
 */
export interface FrameContents {
    addr: string;
    arch: string;
    args: VariableContents[];
    file: string;
    fullname: string;
    func: string;
    level: string;
    line: string;
}

export class FrameItem extends TreeItem {
	constructor(
		public frame: FrameContents
	) {
		super('frame', TreeItemCollapsibleState.Collapsed);

		this.tooltip = '';
		this.description = '';
		this.contextValue = '';


	}

	getInfo(): (FrameInfo | VariableItem)[] {
		let result = [
			new VariableItem(this.frame.args),
			new FrameInfo('fullname', this.frame.fullname),
			new FrameInfo('file', this.frame.file),
			new FrameInfo('arch', this.frame.arch),
			new FrameInfo('addr', this.frame.addr),
			new FrameInfo('func', this.frame.func),
			new FrameInfo('level', this.frame.level),
			new FrameInfo('line', this.frame.line)
		];
		return result;
	}


}

class FrameInfo extends TreeItem {
	constructor(
		public label: string,
		public info: string
	) {
		super(label, TreeItemCollapsibleState.None);
		this.description = info;
	}
}

class VariableItem extends TreeItem {
	constructor(
		public variables: VariableContents[]
	) {
		super('args', TreeItemCollapsibleState.Collapsed);

		this.tooltip = '';
		this.description = '';


	}

	getInfo(): FrameInfo[] {
		return this.variables.map(variable => new VariableInfo(variable.name, variable.value));
	}


}

class VariableInfo extends TreeItem {
	constructor(
		public label: string,
		public info: string
	) {
		super(label, TreeItemCollapsibleState.None);
		this.description = info;
	}
}