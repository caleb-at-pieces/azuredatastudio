/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { Disposable } from 'vs/base/common/lifecycle';
import { getServiceMachineId } from 'vs/platform/serviceMachineId/common/serviceMachineId';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';
import { IFileService } from 'vs/platform/files/common/files';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { IUserDataSyncStoreService, IUserData, IUserDataSyncLogService } from 'vs/platform/userDataSync/common/userDataSync';
import { localize } from 'vs/nls';
import { IProductService } from 'vs/platform/product/common/productService';

interface IMachineData {
	id: string;
	name: string;
	disabled?: boolean;
}

interface IMachinesData {
	version: number;
	machines: IMachineData[];
}

export type IUserDataSyncMachine = Readonly<IMachineData> & { readonly isCurrent: boolean };


export const IUserDataSyncMachinesService = createDecorator<IUserDataSyncMachinesService>('IUserDataSyncMachinesService');
export interface IUserDataSyncMachinesService {
	_serviceBrand: any;

	getMachines(): Promise<IUserDataSyncMachine[]>;
	updateName(name: string): Promise<void>;
	unset(): Promise<void>;

	disable(id: string): Promise<void>
}

export class UserDataSyncMachinesService extends Disposable implements IUserDataSyncMachinesService {

	private static readonly VERSION = 1;
	private static readonly RESOURCE = 'machines';

	_serviceBrand: any;

	private readonly currentMachineIdPromise: Promise<string>;
	private userData: IUserData | null = null;

	constructor(
		@IEnvironmentService environmentService: IEnvironmentService,
		@IFileService fileService: IFileService,
		@IStorageService storageService: IStorageService,
		@IUserDataSyncStoreService private readonly userDataSyncStoreService: IUserDataSyncStoreService,
		@IUserDataSyncLogService private readonly logService: IUserDataSyncLogService,
		@IProductService private readonly productService: IProductService,
	) {
		super();
		this.currentMachineIdPromise = getServiceMachineId(environmentService, fileService, storageService);
	}

	async getMachines(): Promise<IUserDataSyncMachine[]> {
		const currentMachineId = await this.currentMachineIdPromise;
		const machineData = await this.readMachinesData();
		return machineData.machines.map<IUserDataSyncMachine>(machine => ({ ...machine, ...{ isCurrent: machine.id === currentMachineId } }));
	}

	async updateName(name: string): Promise<void> {
		const currentMachineId = await this.currentMachineIdPromise;
		const machineData = await this.readMachinesData();
		let currentMachine = machineData.machines.find(({ id }) => id === currentMachineId);
		if (currentMachine) {
			currentMachine.name = name;
		} else {
			machineData.machines.push({ id: currentMachineId, name });
		}
		await this.writeMachinesData(machineData);
	}

	async unset(): Promise<void> {
		const currentMachineId = await this.currentMachineIdPromise;
		const machineData = await this.readMachinesData();
		const updatedMachines = machineData.machines.filter(({ id }) => id !== currentMachineId);
		if (updatedMachines.length !== machineData.machines.length) {
			machineData.machines = updatedMachines;
			await this.writeMachinesData(machineData);
		}
	}

	async disable(machineId: string): Promise<void> {
		const machineData = await this.readMachinesData();
		const machine = machineData.machines.find(({ id }) => id === machineId);
		if (machine) {
			machine.disabled = true;
			await this.writeMachinesData(machineData);
		}
	}

	private async readMachinesData(): Promise<IMachinesData> {
		this.userData = await this.userDataSyncStoreService.read(UserDataSyncMachinesService.RESOURCE, this.userData);
		const machinesData = this.parse(this.userData);
		if (machinesData.version !== UserDataSyncMachinesService.VERSION) {
			throw new Error(localize('error incompatible', "Cannot read machines data as the current version is incompatible. Please update {0} and try again.", this.productService.nameLong));
		}
		return machinesData;
	}

	private async writeMachinesData(machinesData: IMachinesData): Promise<void> {
		const content = JSON.stringify(machinesData);
		const ref = await this.userDataSyncStoreService.write(UserDataSyncMachinesService.RESOURCE, content, this.userData?.ref || null);
		this.userData = { ref, content };
	}

	private parse(userData: IUserData): IMachinesData {
		if (userData.content !== null) {
			try {
				return JSON.parse(userData.content);
			} catch (e) {
				this.logService.error(e);
			}
		}
		return {
			version: UserDataSyncMachinesService.VERSION,
			machines: []
		};
	}
}
