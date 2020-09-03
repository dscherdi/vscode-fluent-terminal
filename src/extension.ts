import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
import { convertWslPathToWindows } from './wsl';
import { stat } from 'fs';
import { promisify } from 'util';
import { detectInstallation } from './installation';
import { IWTInstallation } from './interfaces';

let installation: IWTInstallation | undefined;

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('fluent-terminal.open', (p) => openFluentTerminal(p)));

  await refreshInstallation();
}

export function deactivate() { }

async function refreshInstallation() {
  installation = await detectInstallation();
}

async function openFluentTerminal(uri?: vscode.Uri) {
  await refreshInstallation();
  if (!installation) {
    return;
  }

  const args = ['new'];

  // If there is no URI, set it to the first workspace folder
  if (!uri) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      uri = workspaceFolders[0]?.uri;
    }
  }

  // If there is a URI, convert it from WSL if required and get the dirname
  if (uri) {
    let cwd = uri.fsPath;
    if (uri.authority) {
      if (uri.authority.startsWith('wsl+')) {
        const distro = uri.authority.split('+')[1];
        cwd = await convertWslPathToWindows(uri.path, distro);
      } else {
        throw new Error(`Unsupported authority "${uri.authority}`);
      }
    }
    if (await isFile(cwd)) {
      cwd = path.dirname(cwd);
    }
    args.push(cwd);
  }

  spawn(installation.executablePath, args, { detached: true });
}

async function isFile(path: string): Promise<boolean> {
  const result = await promisify(stat)(path);
  return !result.isDirectory();
}
