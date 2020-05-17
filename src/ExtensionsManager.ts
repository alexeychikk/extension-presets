import { commands, extensions, Extension } from "vscode";

export interface ExtensionInfo {
  id: string;
  name: string;
  isActive: boolean;
}

export class ExtensionsManager {
  public list(): ExtensionInfo[] {
    return extensions.all
      .filter((ext) => !ext.packageJSON.isBuiltin)
      .map(this.toExtensionInfo)
      .sort((ext1, ext2) => {
        if (ext1.isActive && !ext2.isActive) {
          return -1;
        }
        if (!ext1.isActive && ext2.isActive) {
          return 1;
        }
        return ext1.name.localeCompare(ext2.name);
      });
  }

  public listActive(): ExtensionInfo[] {
    return this.list().filter((e) => e.isActive);
  }

  public listActiveIds(): string[] {
    return this.listActive().map((ext) => ext.id);
  }

  public async enable(ids: string[]): Promise<void> {
    await Promise.all(ids.map(this.enableOne));
  }

  public async enableOnly(ids: string[]): Promise<void> {
    // TODO: this doesn't work
    await commands.executeCommand(
      "workbench.extensions.disableExtension",
      this.listActiveIds()
    );
    await this.enable(ids);
  }

  public reloadWindow() {
    commands.executeCommand("workbench.action.reloadWindow");
  }

  private enableOne = async (id: string): Promise<void> => {
    return extensions.getExtension(id)?.activate();
  };

  private toExtensionInfo = (ext: Extension<any>): ExtensionInfo => {
    return {
      id: ext.id,
      name: ext.packageJSON.displayName || ext.id,
      isActive: ext.isActive,
    };
  };
}
