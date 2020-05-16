import { commands, ExtensionContext } from "vscode";

import { PresetsManager } from "./PresetsManager";
import { ExtensionsManager } from "./ExtensionsManager";
import { PresetsUi } from "./PresetsUi";

const extensionsManager = new ExtensionsManager();
const presetsManager = new PresetsManager();
const presetsUi = new PresetsUi({ extensionsManager, presetsManager });

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand(
			"extension-presets.createPreset",
			presetsUi.createPreset
		)
	);
	context.subscriptions.push(
		commands.registerCommand(
			"extension-presets.applyPreset",
			presetsUi.applyPreset
		)
	);
	context.subscriptions.push(
		commands.registerCommand(
			"extension-presets.changePreset",
			presetsUi.changePreset
		)
	);
	context.subscriptions.push(
		commands.registerCommand(
			"extension-presets.deletePreset",
			presetsUi.deletePreset
		)
	);
}

export function deactivate() {}
