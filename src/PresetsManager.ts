import {
	PresetOptions,
	SerializedPreset,
	ExtensionPreset,
} from "./ExtensionPreset";

export class PresetsManager {
	public async createPreset(options: PresetOptions): Promise<ExtensionPreset> {}

	public async applyPreset(id: string) {}

	public async changePreset(options: SerializedPreset) {}

	public async deletePreset(id: string) {}

	public async listPresets(): Promise<ExtensionPreset[]> {
		return [];
	}
}
