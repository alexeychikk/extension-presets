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
    const createType = await this.pickCreateType();
    if (!createType) {
      return;
    }

    const name = await this.pickPresetName();
    if (!name) {
      return;
    }

    let extensionIds =
      createType === "fromEnabled"
        ? this.extensionsManager.listActiveIds()
        : await this.pickExtensionIds(this.getExtensionItems());
    if (!extensionIds?.length) {
      if (createType === "blank") {
        return;
      }
      // If there are no enabled extensions
      extensionIds = await this.pickExtensionIds(this.getExtensionItems());
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

  public applyPreset = async () => {
    const preset = await this.pickPreset();
    if (!preset) {
      return;
    }
    await this.applyParticularPreset(preset);
  };

  public changePreset = async () => {
    const preset = await this.pickPreset();
    if (!preset) {
      return;
    }
    const name = await this.pickPresetName(preset.name);
    if (!name) {
      return;
    }
    const items = this.getPresetExtensionItems(preset);
    const extensionIds = await this.pickExtensionIds(items);
    if (!extensionIds?.length) {
      return;
    }
    const updatedPreset = { ...preset, name, extensionIds };
    await this.presetsManager.changePreset(updatedPreset);

    const shouldApply = await window.showInformationMessage(
      `Preset '${preset.name}' has been changed`,
      { title: "Apply preset" }
    );
    if (shouldApply) {
      await this.applyParticularPreset(updatedPreset);
    }
  };

  public deletePreset = async () => {
    const preset = await this.pickPreset();
    if (!preset) {
      return;
    }
    await this.presetsManager.deletePreset(preset.id);

    const shouldRestore = await window.showInformationMessage(
      `Preset '${preset.name}' has been deleted`,
      { title: "Restore preset" }
    );

    if (shouldRestore) {
      await this.presetsManager.createPreset(preset);
      const shouldApply = await window.showInformationMessage(
        `Preset '${preset.name}' has been restored`,
        { title: "Apply preset" }
      );
      if (shouldApply) {
        await this.applyParticularPreset(preset);
      }
    }
  };

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

  private async pickCreateType(): Promise<CreatePresetType | undefined> {
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

  private async pickPresetName(name?: string): Promise<string | undefined> {
    const existingPresets = Object.values(this.presetsManager.listPresets());
    return window.showInputBox({
      ignoreFocusOut: true,
      prompt: "Name of the preset",
      value: name,
      validateInput: (value) => {
        if (!ExtensionPreset.isNameValid(value)) {
          return "Please enter at least one character or number";
        }
        if (value.length > 42) {
          return "Name must not exceed 42 characters";
        }
        const formattedValue = this.formatPresetName(value);
        const existingPreset = existingPresets.find(
          (p) => p!.name === formattedValue
        );
        if (existingPreset) {
          return "Preset with such name already exists";
        }
      },
    });
  }

  private async pickExtensionIds(
    extensionItems: ExtensionItem[]
  ): Promise<string[] | undefined> {
    const pickedItems = await window.showQuickPick(extensionItems, {
      ignoreFocusOut: true,
      canPickMany: true,
    });
    return pickedItems?.map((item) => item.id);
  }

  private async pickPreset(): Promise<ExtensionPreset | undefined> {
    const currentPreset = this.presetsManager.getCurrentPreset();
    const presets = this.presetsManager.listPresets();
    const items = Object.values(presets).map((preset) =>
      this.presetToItem(preset!, currentPreset?.id)
    );
    const pickedItem = await window.showQuickPick(items);
    return pickedItem ? presets[pickedItem.id] : undefined;
  }

  private formatPresetName = (name: string) => {
    return name.trim();
  };

  private getExtensionItems = (): ExtensionItem[] => {
    return this.extensionsManager.list().map(this.extensionInfoToItem);
  };

  private getPresetExtensionItems = (
    preset: ExtensionPreset
  ): ExtensionItem[] => {
    return this.extensionsManager.list().map((ext) => ({
      ...this.extensionInfoToItem(ext),
      picked: preset.extensionIds.includes(ext.id),
    }));
  };

  private extensionInfoToItem = (info: ExtensionInfo): ExtensionItem => {
    return {
      id: info.id,
      label: info.name,
      description: `(${info.id})`,
      picked: info.isActive,
    };
  };

  private presetToItem = (
    preset: ExtensionPreset,
    currentPresetId?: string
  ): PresetItem => {
    return {
      id: preset.id,
      label: preset.name,
      description: preset.id === currentPresetId ? "(current)" : undefined,
    };
  };
}

type CreatePresetType = "blank" | "fromEnabled";

interface ExtensionItem extends QuickPickItem {
  id: string;
}

interface PresetItem extends QuickPickItem {
  id: string;
}
