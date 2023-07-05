/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as azdata from 'azdata';
import * as vscode from 'vscode';
import { ObjectManagementDialogBase, ObjectManagementDialogOptions } from './objectManagementDialogBase';
import { IObjectManagementService } from 'mssql';
import * as localizedConstants from '../localizedConstants';
import { ViewServerPropertiesDocUrl } from '../constants';
import { Server, ServerViewInfo } from '../interfaces';

export class ServerPropertiesDialog extends ObjectManagementDialogBase<Server, ServerViewInfo> {
	private generalTab: azdata.Tab;
	private platformSection: azdata.GroupContainer;
	private sqlServerSection: azdata.GroupContainer;
	private nameInput: azdata.InputBoxComponent;
	private hardwareGenerationInput: azdata.InputBoxComponent;
	private languageDropdown: azdata.DropDownComponent;
	private memoryInput: azdata.InputBoxComponent;
	private operatingSystemInput: azdata.InputBoxComponent;
	private platformInput: azdata.InputBoxComponent;
	private processorsInput: azdata.InputBoxComponent;
	private isClusteredInput: azdata.InputBoxComponent;
	private isHadrEnabledInput: azdata.InputBoxComponent;
	private isPolyBaseInstalledInput: azdata.InputBoxComponent;
	private isXTPSupportedInput: azdata.InputBoxComponent;
	private productInput: azdata.InputBoxComponent;
	private reservedStorageSizeInMBInput: azdata.InputBoxComponent;
	private rootDirectoryInput: azdata.InputBoxComponent;
	private serverCollationInput: azdata.InputBoxComponent;
	private serviceTierInput: azdata.InputBoxComponent;
	private storageSpaceUsageInGBInput: azdata.InputBoxComponent;
	private versionInput: azdata.InputBoxComponent;

	private memoryTab: azdata.Tab;
	private memorySection: azdata.GroupContainer;
	private minServerMemoryInput: azdata.InputBoxComponent;
	private maxServerMemoryInput: azdata.InputBoxComponent;
	private engineEdition: azdata.DatabaseEngineEdition;

	private processorsTab: azdata.Tab;
	private processorsSection: azdata.GroupContainer;
	private autoSetProcessorAffinityMaskForAllCheckbox: azdata.CheckBoxComponent;
	private autoSetProcessorIOAffinityMaskForAllCheckbox: azdata.CheckBoxComponent;
	private _disposables: vscode.Disposable[] = [];

	constructor(objectManagementService: IObjectManagementService, options: ObjectManagementDialogOptions) {
		super(objectManagementService, options);
	}

	protected override get helpUrl(): string {
		return ViewServerPropertiesDocUrl;
	}

	protected override get isDirty(): boolean {
		return true;
	}

	protected async initializeUI(): Promise<void> {
		const serverInfo = await azdata.connection.getServerInfo(this.options.objectExplorerContext.connectionProfile.id);
		this.engineEdition = serverInfo.engineEditionId;
		this.initializeGeneralSection();
		this.initializeMemorySection();
		this.initializeProcessorsSection();
		const serverPropertiesTabGroup = { title: '', tabs: [this.generalTab, this.memoryTab, this.processorsTab] };
		const serverPropertiesTabbedPannel = this.modelView.modelBuilder.tabbedPanel()
			.withTabs([serverPropertiesTabGroup])
			.withProps({
				CSSStyles: {
					'margin': '-10px 0px 0px -10px'
				}
			}).component();
		this.formContainer.addItem(serverPropertiesTabbedPannel);
	}

	private initializeGeneralSection(): void {
		this.nameInput = this.createInputBox(localizedConstants.NameText, async (newValue) => {
			this.objectInfo.name = newValue;
		}, this.objectInfo.name, this.options.isNewObject);
		const nameContainer = this.createLabelInputContainer(localizedConstants.NameText, this.nameInput);

		this.hardwareGenerationInput = this.createInputBox(localizedConstants.HardwareGenerationText, async () => { }, this.objectInfo.hardwareGeneration.toString(), this.options.isNewObject);
		const hardwareGenerationContainer = this.createLabelInputContainer(localizedConstants.HardwareGenerationText, this.hardwareGenerationInput);

		this.languageDropdown = this.createDropdown(localizedConstants.LanguageText, async () => { }, [this.objectInfo.language], this.objectInfo.language, this.options.isNewObject);
		const languageContainer = this.createLabelInputContainer(localizedConstants.LanguageText, this.languageDropdown);

		this.memoryInput = this.createInputBox(localizedConstants.MemoryText, async () => { }, this.objectInfo.memoryInMB.toString().concat(' MB'), this.options.isNewObject);
		const memoryContainer = this.createLabelInputContainer(localizedConstants.MemoryText, this.memoryInput);

		this.operatingSystemInput = this.createInputBox(localizedConstants.OperatingSystemText, async () => { }, this.objectInfo.operatingSystem, this.options.isNewObject);
		const operatingSystemContainer = this.createLabelInputContainer(localizedConstants.OperatingSystemText, this.operatingSystemInput);

		this.platformInput = this.createInputBox(localizedConstants.PlatformText, async () => { }, this.objectInfo.platform, this.options.isNewObject);
		const platformContainer = this.createLabelInputContainer(localizedConstants.PlatformText, this.platformInput);

		this.processorsInput = this.createInputBox(localizedConstants.ProcessorsText, async () => { }, this.objectInfo.processors, this.options.isNewObject);
		const processorsContainer = this.createLabelInputContainer(localizedConstants.ProcessorsText, this.processorsInput);

		this.isClusteredInput = this.createInputBox(localizedConstants.IsClusteredText, async () => { }, this.objectInfo.isClustered.toString(), this.options.isNewObject);
		const isClusteredContainer = this.createLabelInputContainer(localizedConstants.IsClusteredText, this.isClusteredInput);

		this.isHadrEnabledInput = this.createInputBox(localizedConstants.IsHadrEnabledText, async () => { }, this.objectInfo.isHadrEnabled.toString(), this.options.isNewObject);
		const isHadrEnabledContainer = this.createLabelInputContainer(localizedConstants.IsHadrEnabledText, this.isHadrEnabledInput);

		this.isPolyBaseInstalledInput = this.createInputBox(localizedConstants.IsPolyBaseInstalledText, async () => { }, this.objectInfo.isPolyBaseInstalled.toString(), this.options.isNewObject);
		const isPolyBaseInstalledContainer = this.createLabelInputContainer(localizedConstants.IsPolyBaseInstalledText, this.isPolyBaseInstalledInput);

		this.isXTPSupportedInput = this.createInputBox(localizedConstants.IsXTPSupportedText, async () => { }, this.objectInfo.isXTPSupported.toString(), this.options.isNewObject);
		const isXTPSupportedContainer = this.createLabelInputContainer(localizedConstants.IsXTPSupportedText, this.isXTPSupportedInput);

		this.productInput = this.createInputBox(localizedConstants.ProductText, async () => { }, this.objectInfo.product, this.options.isNewObject);
		const productContainer = this.createLabelInputContainer(localizedConstants.ProductText, this.productInput);

		this.reservedStorageSizeInMBInput = this.createInputBox(localizedConstants.ReservedStorageSizeInMBText, async () => { }, this.objectInfo.reservedStorageSizeMB.toString().concat(' MB'), this.options.isNewObject);
		const reservedStorageSizeInMBContainer = this.createLabelInputContainer(localizedConstants.ReservedStorageSizeInMBText, this.reservedStorageSizeInMBInput);

		this.rootDirectoryInput = this.createInputBox(localizedConstants.RootDirectoryText, async () => { }, this.objectInfo.rootDirectory, this.options.isNewObject);
		const rootDirectoryContainer = this.createLabelInputContainer(localizedConstants.RootDirectoryText, this.rootDirectoryInput);

		this.serverCollationInput = this.createInputBox(localizedConstants.ServerCollationText, async () => { }, this.objectInfo.serverCollation, this.options.isNewObject);
		const serverCollationContainer = this.createLabelInputContainer(localizedConstants.ServerCollationText, this.serverCollationInput);

		this.serviceTierInput = this.createInputBox(localizedConstants.ServiceTierText, async () => { }, this.objectInfo.serviceTier, this.options.isNewObject);
		const serviceTierContainer = this.createLabelInputContainer(localizedConstants.ServiceTierText, this.serviceTierInput);

		this.storageSpaceUsageInGBInput = this.createInputBox(localizedConstants.StorageSpaceUsageInMBText, async () => { }, this.objectInfo.storageSpaceUsageInGB.toString().concat(' GB'), this.options.isNewObject);
		const storageSpaceUsageInGbContainer = this.createLabelInputContainer(localizedConstants.StorageSpaceUsageInMBText, this.storageSpaceUsageInGBInput);

		this.versionInput = this.createInputBox(localizedConstants.VersionText, async () => { }, this.objectInfo.version, this.options.isNewObject);
		const versionContainer = this.createLabelInputContainer(localizedConstants.VersionText, this.versionInput);

		let platformItems = [
			nameContainer,
			languageContainer,
			memoryContainer,
			operatingSystemContainer,
			platformContainer,
			processorsContainer
		];

		let sqlServerItems = [
			isClusteredContainer,
			isHadrEnabledContainer,
			isPolyBaseInstalledContainer,
			isXTPSupportedContainer,
			productContainer,
			rootDirectoryContainer,
			serverCollationContainer,
			versionContainer
		];

		if (this.engineEdition === azdata.DatabaseEngineEdition.SqlManagedInstance) {
			platformItems.unshift(hardwareGenerationContainer);
			sqlServerItems.push(reservedStorageSizeInMBContainer, serviceTierContainer, storageSpaceUsageInGbContainer);
			// remove isXTPSupported
			sqlServerItems.splice(3, 1);
		}

		this.platformSection = this.createGroup('Platform', platformItems, true);
		this.sqlServerSection = this.createGroup('SQL Server', sqlServerItems, true);

		const generalContainer = this.createGroup('', [this.platformSection, this.sqlServerSection])

		this.generalTab = this.createTab('generalId', localizedConstants.GeneralSectionHeader, generalContainer);
	}

	private initializeMemorySection(): void {
		const isEnabled = this.engineEdition !== azdata.DatabaseEngineEdition.SqlManagedInstance;
		this.minServerMemoryInput = this.createInputBox(localizedConstants.minServerMemoryText, async (newValue) => {
			this.objectInfo.minServerMemory = +newValue;
		}, this.objectInfo.minServerMemory.toString(), isEnabled, 'number');
		const minMemoryContainer = this.createLabelInputContainer(localizedConstants.minServerMemoryText, this.minServerMemoryInput);

		this.maxServerMemoryInput = this.createInputBox(localizedConstants.maxServerMemoryText, async (newValue) => {
			this.objectInfo.maxServerMemory = +newValue;
		}, this.objectInfo.maxServerMemory.toString(), isEnabled, 'number');
		const maxMemoryContainer = this.createLabelInputContainer(localizedConstants.maxServerMemoryText, this.maxServerMemoryInput);

		this.memorySection = this.createGroup('', [
			minMemoryContainer,
			maxMemoryContainer
		], false);

		this.memoryTab = this.createTab('memoryId', localizedConstants.MemoryText, this.memorySection);
	}

	private initializeProcessorsSection(): void {
		const isEnabled = this.engineEdition !== azdata.DatabaseEngineEdition.SqlManagedInstance;
		const cssClass = 'no-borders';
		this.autoSetProcessorAffinityMaskForAllCheckbox = this.createCheckbox(localizedConstants.autoSetProcessorAffinityMaskForAllText, async (newValue) => {
			this.objectInfo.autoSetProcessorAffinityMaskForAll = newValue;
		}, this.objectInfo.autoSetProcessorAffinityMaskForAll, isEnabled);
		const autoProcessorAffinityContainer = this.createLabelInputContainer(localizedConstants.autoSetProcessorAffinityMaskForAllText, this.autoSetProcessorAffinityMaskForAllCheckbox);

		this.autoSetProcessorIOAffinityMaskForAllCheckbox = this.createCheckbox(localizedConstants.autoSetProcessorAffinityIOMaskForAllText, async (newValue) => {
			this.objectInfo.autoSetProcessorAffinityIOMaskForAll = newValue;
		}, this.objectInfo.autoSetProcessorAffinityIOMaskForAll, isEnabled);
		const autoProcessorIOAffinityContainer = this.createLabelInputContainer(localizedConstants.autoSetProcessorAffinityIOMaskForAllText, this.autoSetProcessorIOAffinityMaskForAllCheckbox);
		let tableData = this.objectInfo.processorList.map(row => [row.processor, row.processorAffinity, row.processorIOAffinity]);
		let processorTable = this.createTable(localizedConstants.processorLabel,
			[
				<azdata.TableColumn>{
					name: localizedConstants.processorColumnText,
					value: localizedConstants.processorColumnText,
					type: azdata.ColumnType.text,
					resizable: false,
					width: 100,
					cssClass: cssClass,
					headerCssClass: cssClass,
				},
				<azdata.TableColumn>{
					name: localizedConstants.processorAffinityColumnText,
					value: localizedConstants.processorAffinityColumnText,
					type: azdata.ColumnType.checkBox,
					resizable: false,
					width: 100,
					action: azdata.ActionOnCellCheckboxCheck.selectRow,
					cssClass: cssClass,
					headerCssClass: cssClass,
				},
				<azdata.TableColumn>{
					name: localizedConstants.processorIOAffinityColumnText,
					value: localizedConstants.processorIOAffinityColumnText,
					type: azdata.ColumnType.checkBox,
					resizable: false,
					width: 100,
					action: azdata.ActionOnCellCheckboxCheck.selectRow,
					cssClass: cssClass,
					headerCssClass: cssClass,
				}
			], tableData);

		this._disposables.push(processorTable.onRowSelected(async () => {
			if (processorTable.selectedRows.length > 0) {
				const result = processorTable.data;
				this.onFormFieldChange();
			}
		}));

		let tableGroup = this.createGroup('', [processorTable], false);

		this.processorsSection = this.createGroup(localizedConstants.enableProcessorText, [
			autoProcessorAffinityContainer,
			autoProcessorIOAffinityContainer,
			tableGroup
		], false);

		this.processorsTab = this.createTab('processorsId', localizedConstants.ProcessorsText, this.processorsSection);
	}
}
