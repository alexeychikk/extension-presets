import { commands, extensions, Extension } from 'vscode';
import { EXTENSION_ID } from './constants';

export interface ExtensionInfo {
  id: string;
  name: string;
  isActive: boolean;
}

export class ExtensionsManager {
  public list(): ExtensionInfo[] {
    return extensions.all
      .filter((ext) => !ext.packageJSON.isBuiltin && ext.id !== EXTENSION_ID)
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
    const commandsList = (await commands.getCommands()).filter((c) =>
      c.includes('extension'),
    );
    console.log('COMMANDS', commandsList);
    await commands.executeCommand(
      'workbench.extensions.action.disableAllWorkspace',
    );
    await this.enableOne(EXTENSION_ID);
    try {
      await this.enable(ids);
    } catch (e) {
      console.log(e);
    }
  }

  public reloadWindow() {
    commands.executeCommand('workbench.action.reloadWindow');
  }

  private enableOne = async (id: string): Promise<void> => {
    await extensions.getExtension(id)?.activate();
  };

  private toExtensionInfo = (ext: Extension<any>): ExtensionInfo => {
    return {
      id: ext.id,
      name: ext.packageJSON.displayName || ext.id,
      isActive: ext.isActive,
    };
  };
}
