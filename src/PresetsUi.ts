import { window, QuickPickItem } from "vscode";

import { ExtensionsManager, ExtensionInfo } from "./ExtensionsManager";
import { PresetsManager } from "./PresetsManager";
import { ExtensionPreset } from "./ExtensionPreset";

export class PresetsUi {
	private extensionsManager: ExtensionsManager;
	private presetsManager: PresetsManager;

	constructor({
		extensionsManager,
		presetsManager,
	}: {
		extensionsManager: ExtensionsManager;
		presetsManager: PresetsManager;
	}) {
		this.extensionsManager = extensionsManager;
		this.presetsManager = presetsManager;
	}

	public createPreset = async () => {
		const createType = await this.getCreateType();
		if (!createType) {
			return;
		}

		const name = await this.getPresetName();
		if (!name) {
			return;
		}

		let extensionIds =
			createType === "fromEnabled"
				? this.extensionsManager.listActiveIds()
				: await this.getExtensionIds(this.getExtensionItems());
		if (!extensionIds?.length) {
			if (createType === "blank") {
				return;
			}
			// If there are no enabled extensions
			extensionIds = await this.getExtensionIds(this.getExtensionItems());
		}
		if (!extensionIds?.length) {
			return;
		}

		const preset = await this.presetsManager.createPreset({
			name,
			extensionIds,
		});

		const shouldApply = await window.showInformationMessage(
			`Preset '${preset.name}' has been created`,
			{ title: "Apply preset" }
		);
		if (shouldApply) {
			await this.applyParticularPreset(preset);
		}
	};

	public applyPreset = async () => {};

	public changePreset = async () => {};

	public deletePreset = async () => {};

	private async applyParticularPreset(preset: ExtensionPreset) {
		await this.presetsManager.applyPreset(preset.id);
		const shouldReload = await window.showInformationMessage(
			`Preset '${preset.name}' has been applied. Please reload the window`,
			{ title: "Reload" }
		);
		if (shouldReload) {
			this.extensionsManager.reloadWindow();
		}
	}

	private async getCreateType(): Promise<CreatePresetType | undefined> {
		const item = await window.showQuickPick([
			{
				label: "$(search-new-editor) Create blank preset",
				type: "blank",
			},
			{
				label: "$(extensions) Create from enabled extensions",
				type: "fromEnabled",
			},
		]);
		return item?.type as CreatePresetType;
	}

	private async getPresetName(): Promise<string | undefined> {
		const existingPresets = await this.presetsManager.listPresets();
		return window.showInputBox({
			ignoreFocusOut: true,
			prompt: "Name of the preset",
			validateInput: (value) => {
				if (!ExtensionPreset.isNameValid(value)) {
					return "Please enter at least one character or number";
				}
				if (value.length > 42) {
					return "Name must not exceed 42 characters";
				}
				const formattedValue = this.formatName(value);
				if (existingPresets.find((p) => p.name === formattedValue)) {
					return "Preset with such name already exists";
				}
			},
		});
	}

	private async getExtensionIds(
		extensionItems: ExtensionItem[]
	): Promise<string[] | undefined> {
		const pickedItems = await window.showQuickPick(extensionItems, {
			ignoreFocusOut: true,
			canPickMany: true,
		});
		return pickedItems?.map((item) => item.id);
	}

	private formatName = (name: string) => {
		return name.trim();
	};

	private getExtensionItems = (): ExtensionItem[] => {
		return this.extensionsManager.list().map(this.extensionInfoToItem);
	};

	private extensionInfoToItem = (info: ExtensionInfo): ExtensionItem => {
		return {
			id: info.id,
			label: info.name,
			description: `(${info.id})`,
			picked: info.isActive,
		};
	};
}

type CreatePresetType = "blank" | "fromEnabled";

interface ExtensionItem extends QuickPickItem {
	id: string;
}
