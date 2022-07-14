/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as vscode from 'vscode';
import * as constants from '../../constants/strings';
import * as styles from '../../constants/styles';
import * as mssql from 'mssql';

export class GenerateArmTemplateDialog {

	private static readonly CloseButtonText: string = 'Close';

	private dialog: azdata.window.Dialog | undefined;
	private _isOpen: boolean = false;

	private _disposables: vscode.Disposable[] = [];

	private _generateArmTemplateContainer!: azdata.FlexContainer;
	private _saveArmTemplateContainer!: azdata.FlexContainer;

	private async initializeDialog(dialog: azdata.window.Dialog): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			dialog.registerContent(async (view) => {
				try {
					const flex = this.createContainer(view);

					this._disposables.push(view.onClosed(e => {
						this._disposables.forEach(
							d => { try { d.dispose(); } catch { } });
					}));

					await view.initializeModel(flex);
					resolve();
				} catch (ex) {
					reject(ex);
				}
			});
		});
	}

	private createContainer(_view: azdata.ModelView): azdata.FlexContainer {
		const container = _view.modelBuilder.flexContainer().withProps({
			CSSStyles: {
				'margin': '8px 16px',
				'flex-direction': 'column',
			}
		}).component();
		this._generateArmTemplateContainer = this.CreateGenerateArmTemplateContainer(_view);
		this._saveArmTemplateContainer = this.CreateSaveArmTemplateContainer(_view);
		container.addItems([
			this._generateArmTemplateContainer,
			this._saveArmTemplateContainer,
		]);
		return container;
	}

	// TODO: Implement this
	private CreateGenerateArmTemplateContainer(_view: azdata.ModelView): azdata.FlexContainer {
		const container = _view.modelBuilder.flexContainer().withProps({
			CSSStyles: {
				...styles.BODY_CSS,
			}
		}).component();
		return container;
	}

	// TODO: Implement this
	private CreateSaveArmTemplateContainer(_view: azdata.ModelView): azdata.FlexContainer {
		const container = _view.modelBuilder.flexContainer().withProps({
			CSSStyles: {
				...styles.BODY_CSS,
			}
		}).component();
		return container;
	}

	public async openDialog(dialogName?: string, recommendations?: mssql.SkuRecommendationResult) {
		if (!this._isOpen){
			this._isOpen = true;

			this.dialog = azdata.window.createModelViewDialog('Generate ARM template', 'GenerateArmTemplateDialog', 'narrow');

			this.dialog.okButton.label = GenerateArmTemplateDialog.CloseButtonText;
			this._disposables.push(this.dialog.okButton.onClick(async () => await this.execute()));

			this.dialog.cancelButton.hidden = true;

			const dialogSetupPromises: Thenable<void>[] = [];
			dialogSetupPromises.push(this.initializeDialog(this.dialog));
			azdata.window.openDialog(this.dialog);
			await Promise.all(dialogSetupPromises);
		}
	}

	protected async execute() {
		this._isOpen = false;
	}

	public get isOpen(): boolean {
		return this._isOpen;
	}

}
