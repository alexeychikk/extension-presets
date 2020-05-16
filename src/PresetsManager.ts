import { workspace } from 'vscode';

import {
  PresetOptions,
  SerializedPreset,
  ExtensionPreset,
} from './ExtensionPreset';
import { EXTENSION_NAME } from './constants';
import { ExtensionsManager } from './ExtensionsManager';

export class PresetsManager {
  private extensionsManager: ExtensionsManager;

  constructor({ extensionsManager }: { extensionsManager: ExtensionsManager }) {
    this.extensionsManager = extensionsManager;
  }

  public async createPreset(options: PresetOptions): Promise<ExtensionPreset> {
    const preset = new ExtensionPreset(options);
    await this.updatePreset(preset);
    return preset;
  }

  public async applyPreset(id: string) {
    const preset = this.getPreset(id);
    if (!preset) {
      throw new Error(`Preset with ID '${id}' was not found`);
    }
    await this.extensionsManager.enableOnly(preset.extensionIds);
    await this.updateCurrentPreset(preset.id);
  }

  public async changePreset(options: SerializedPreset) {
    await this.updatePreset(options);
  }

  public async deletePreset(id: string) {
    // eslint-disable-next-line no-unused-vars
    const { [id]: deletedPreset, ...presets } = this.listPresets();
    await this.updatePresetsMap(presets);
  }

  public listPresets(): { [id: string]: ExtensionPreset | undefined } {
    const currentPresetId = this.getConfig('currentPreset');
    const presets = this.getConfig('presets') || {};
    if (currentPresetId) {
      // Place current preset first
      const { [currentPresetId]: currentPreset, ...restPresets } = presets;
      return { [currentPresetId]: currentPreset, ...restPresets };
    }
    return presets;
  }

  public getPreset(id: string): ExtensionPreset | undefined {
    return this.listPresets()[id];
  }

  public getCurrentPreset(): ExtensionPreset | undefined {
    const presetId = this.getConfig('currentPreset');
    if (!presetId) {
      return;
    }
    return this.getPreset(presetId);
  }

  private async updatePreset(preset: ExtensionPreset) {
    const updatedPresets = { ...this.listPresets(), [preset.id]: preset };
    await this.updatePresetsMap(updatedPresets);
  }

  private async updatePresetsMap(presets: {
    [id: string]: ExtensionPreset | undefined;
  }) {
    await workspace
      .getConfiguration(EXTENSION_NAME)
      .update('presets', presets, true);
  }

  private async updateCurrentPreset(id?: string) {
    await workspace
      .getConfiguration(EXTENSION_NAME)
      .update('currentPreset', id, true);
  }

  private getConfig<Key extends keyof PresetsConfig>(
    key: Key,
  ): PresetsConfig[Key] | undefined {
    return workspace.getConfiguration(EXTENSION_NAME).get(key);
  }
}

interface PresetsConfig {
  presets: { [id: string]: SerializedPreset | undefined };
  currentPreset?: string;
}
