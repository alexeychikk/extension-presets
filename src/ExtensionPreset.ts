import { generate as generateShortId } from "shortid";

export class ExtensionPreset {
	public id: string;
	public name: string;
	public extensionIds: string[];

	constructor({
		id,
		name,
		extensionIds,
	}: {
		id?: string;
		name: string;
		extensionIds: string[];
	}) {
		if (ExtensionPreset.isNameValid(name)) {
			throw new Error("Preset name is not valid");
		}
		this.id = id || ExtensionPreset.generateId(name);
		this.name = name;
		this.extensionIds = extensionIds;
	}

	public static generateId(name: string): string {
		const safeName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
		return `${safeName}-${generateShortId()}`;
	}

	public static isNameValid(name: string): boolean {
		return !!name.trim();
	}
}

export type PresetOptions = Omit<ExtensionPreset, "id">;

export type SerializedPreset = Required<ExtensionPreset>;
