import * as vscode from 'vscode';
import { detectEncoding, normalizeEncoding } from './encodingDetector';
import { convertEncoding, isUtf8File } from './converter';

interface EncodingQuickPickItem extends vscode.QuickPickItem {
  encoding: string;
}

const COMMON_ENCODINGS = [
  { label: 'GBK', description: '简体中文 (Windows)' },
  { label: 'GB2312', description: '简体中文 (基本)' },
  { label: 'Big5', description: '繁体中文' },
  { label: 'Shift-JIS', description: '日文' },
  { label: 'EUC-KR', description: '韩文' },
  { label: 'ISO-8859-1', description: '西欧语言' },
  { label: 'Windows-1252', description: '西欧语言 (Windows)' },
  { label: 'UTF-8', description: 'Unicode' },
  { label: 'UTF-16LE', description: 'Unicode (Little Endian)' },
  { label: 'UTF-16BE', description: 'Unicode (Big Endian)' }
];

function buildEncodingList(detectedEncoding: string): EncodingQuickPickItem[] {
  const items: EncodingQuickPickItem[] = [];
  const normalized = normalizeEncoding(detectedEncoding);

  if (detectedEncoding && detectedEncoding !== 'unknown') {
    items.push({
      label: `$(star) ${normalized}`,
      description: '自动检测',
      detail: '推荐使用此编码',
      encoding: normalized
    });
  }

  for (const enc of COMMON_ENCODINGS) {
    if (enc.label !== normalized) {
      items.push({
        label: enc.label,
        description: enc.description,
        encoding: enc.label
      });
    }
  }

  return items;
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'encoding-converter.convertEncoding',
    async (uri?: vscode.Uri) => {
      try {
        let filePath: string | undefined;

        if (uri) {
          filePath = uri.fsPath;
        } else if (vscode.window.activeTextEditor) {
          filePath = vscode.window.activeTextEditor.document.uri.fsPath;
        }

        if (!filePath) {
          vscode.window.showWarningMessage('请先打开或选择一个文件');
          return;
        }

        const isUtf8 = await isUtf8File(filePath);
        if (isUtf8) {
          const choice = await vscode.window.showInformationMessage(
            '该文件已经是 UTF-8 编码，是否仍要继续转换？',
            '继续',
            '取消'
          );
          if (choice !== '继续') {
            return;
          }
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: '正在检测文件编码...',
            cancellable: false
          },
          async () => {
            const detection = await detectEncoding(filePath!);
            const items = buildEncodingList(detection.encoding);

            const selected = await vscode.window.showQuickPick(items, {
              placeHolder: '请选择文件的原始编码格式',
              matchOnDescription: true,
              matchOnDetail: true
            });

            if (!selected) {
              return;
            }

            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: `正在转换编码 ${selected.encoding} → UTF-8...`,
                cancellable: false
              },
              async () => {
                await convertEncoding(filePath!, selected.encoding, 'utf8');

                if (vscode.window.activeTextEditor?.document.uri.fsPath === filePath) {
                  const document = vscode.window.activeTextEditor.document;
                  await document.save();
                  await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                  const reopenedDoc = await vscode.workspace.openTextDocument(filePath!);
                  await vscode.window.showTextDocument(reopenedDoc);
                }

                vscode.window.showInformationMessage(
                  `文件编码已成功转换为 UTF-8！`
                );
              }
            );
          }
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `编码转换失败: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
