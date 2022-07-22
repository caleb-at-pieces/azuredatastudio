/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { MigrationStateModel, MigrationTargetType } from '../../models/stateMachine';
import { join } from 'path';
import * as styles from '../../constants/styles';
import * as mssql from 'mssql';
import * as utils from '../../api/utils';

export class GenerateArmTemplateDialog {

	private static readonly CloseButtonText: string = 'Close';

	private dialog: azdata.window.Dialog | undefined;
	private _isOpen: boolean = false;

	private _disposables: vscode.Disposable[] = [];

	private _generateArmTemplateContainer!: azdata.FlexContainer;
	private _saveArmTemplateContainer!: azdata.FlexContainer;

	private _armTemplateTextBox!: azdata.TextComponent;
	private _armTemplateText!: string;

	constructor(public model: MigrationStateModel, public _targetType: MigrationTargetType) {

	}

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

	private CreateGenerateArmTemplateContainer(_view: azdata.ModelView): azdata.FlexContainer {

		const armTemplateLoader = _view.modelBuilder.loadingComponent().component();

		const armTemplateProgress = _view.modelBuilder.text().withProps({
			// Replace with localized string in the future
			value: 'ARM template generation in progress...',
			CSSStyles: {
				...styles.BODY_CSS,
				'margin-right': '20px'
			}
		}).component();

		const armTemplateLoadingContainer = _view.modelBuilder.flexContainer().withLayout({
			height: '100%',
			flexFlow: 'row',
		}).component();

		armTemplateLoadingContainer.addItem(armTemplateProgress, { flex: '0 0 auto' });
		armTemplateLoadingContainer.addItem(armTemplateLoader, { flex: '0 0 auto' });

		const armTemplateLoadingInfo = _view.modelBuilder.text().withProps({
			// Replace with localized string in the future
			value: 'We are generating an ARM template according to your recommended SKU. This may take some time.',
			CSSStyles: {
				...styles.BODY_CSS,
			}
		}).component();

		const armTemplateLoadingInfoCcontainer = _view.modelBuilder.flexContainer().withLayout({
			height: '100%',
			flexFlow: 'row',
		}).component();

		armTemplateLoadingInfoCcontainer.addItem(armTemplateLoadingInfo, { flex: '0 0 auto' });

		const container = _view.modelBuilder.flexContainer().withLayout({
			flexFlow: 'column'
		}).withItems([
			armTemplateLoadingContainer,
			armTemplateLoadingInfoCcontainer
		]).component();

		return container;
	}

	// TODO: Implement this
	private CreateSaveArmTemplateContainer(_view: azdata.ModelView): azdata.FlexContainer {
		const armTemplateSaveInstructions = _view.modelBuilder.text().withProps({
			// TODO: Update text
			// Replace with localized string in the future
			value: 'ARM template save instructions placeholder',
			CSSStyles: {
				...styles.BODY_CSS,
				'margin-bottom': '8px',
			}
		}).component();

		this._armTemplateTextBox = _view.modelBuilder.text().withProps({
			value: this._armTemplateText,
			width: '100%',
			height: '100%',
			CSSStyles: {
				'font': '14px "Monaco", "Menlo", "Consolas", "Droid Sans Mono", "Inconsolata", "Courier New", monospace',
				'margin': '0'
			}

		}).component();

		const saveArmTemplateButton = _view.modelBuilder.button().withProps({
			// Replace with localized string in the future
			label: 'Save ARM template',
			width: 120,
			CSSStyles: {
				'margin': '0'
			}
		}).component();
		this._disposables.push(saveArmTemplateButton.onDidClick(async (e) => {
			await this.saveArmTemplate();
		}));

		const textContainer = _view.modelBuilder.flexContainer().withLayout({
			flexFlow: 'column',
			height: 500,
		}).withProps({
			CSSStyles: {
				'overflow': 'auto',
				'user-select': 'text',
				'margin-bottom': '8px'
			}
		}).withItems([
			this._armTemplateTextBox
		]).component();

		const container = _view.modelBuilder.flexContainer().withLayout({
			flexFlow: 'column',
		}).withProps({
			display: 'none',
		}).withItems([
			armTemplateSaveInstructions,
			textContainer,
			saveArmTemplateButton
		]).component();

		return container;
	}

	private async updateArmTemplateStatus(succeeded: boolean): Promise<void> {
		await this._generateArmTemplateContainer.updateCssStyles({ 'display': 'none' });

		if (succeeded){
			this._armTemplateText = this.model._provisioningScriptResult.result.provisioningScript;
			this._armTemplateTextBox.value = this._armTemplateText;
			await this._saveArmTemplateContainer.updateCssStyles({ 'display': 'inline' });
		}
	}

	public async openDialog(dialogName?: string, recommendations?: mssql.SkuRecommendationResult) {
		if (!this._isOpen){
			this._isOpen = true;

			this.dialog = azdata.window.createModelViewDialog('Generate ARM template', 'GenerateArmTemplateDialog', 'medium');

			this.dialog.okButton.label = GenerateArmTemplateDialog.CloseButtonText;
			this._disposables.push(this.dialog.okButton.onClick(async () => await this.execute()));
			this.dialog.cancelButton.hidden = true;

			const dialogSetupPromises: Thenable<void>[] = [];
			dialogSetupPromises.push(this.initializeDialog(this.dialog));

			azdata.window.openDialog(this.dialog);
			await Promise.all(dialogSetupPromises);

			// Generate ARM template upon opening dialog
			await this.model.generateProvisioningScript(this._targetType);
			const error = this.model._provisioningScriptResult.error;

			if (error) {
				await this.updateArmTemplateStatus(false);
			}
			else {
				await this.updateArmTemplateStatus(true);

			}
		}
	}

	protected async execute() {
		this._isOpen = false;
	}

	public get isOpen(): boolean {
		return this._isOpen;
	}

	private async saveArmTemplate(): Promise<void> {
		const filePath = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(join(utils.getUserHome()!, 'ARMTemplate-' + new Date().toISOString().split('T')[0] + '.json')),
			filters: {
				'JSON File': ['json']
			}
		});

		fs.writeFileSync(filePath!.fsPath, this._armTemplateText);
	}

}