import * as vscode from 'vscode';
import { join } from 'path';
import { IWTInstallation } from './interfaces';
import { promisify } from 'util';
import { exists } from 'fs';

export function getExecutablePath(): string {
  return join(`${getLocalAppDataDir()}/Microsoft/WindowsApps/${getChannelAppId()}/flute.exe`);
}

function getLocalAppDataDir(): string {
  const localAppDataDir = process.env.LOCALAPPDATA;
  if (!localAppDataDir) {
    throw Error('Environment variable LOCALAPPDATA is not set');
  }
  return localAppDataDir;
}

function getChannelAppId(): string {
  return '53621FSApps.FluentTerminal_87x1pks76srcp';
}

export async function detectInstallation(): Promise<IWTInstallation | undefined> {
  const pathExists = await promisify(exists)(getExecutablePath());

  if (!pathExists) {
    const selection = await vscode.window.showErrorMessage('Could not detect Fluent Terminal installation', 'Open Microsoft Store');
    if (selection === 'Open Microsoft Store') {
      const url = 'https://www.microsoft.com/en-us/p/fluent-terminal/9p2krlmfxf9t';
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
    return undefined;
  }

  const installation: IWTInstallation = {
    executablePath: getExecutablePath()
  };

  return installation;
}
