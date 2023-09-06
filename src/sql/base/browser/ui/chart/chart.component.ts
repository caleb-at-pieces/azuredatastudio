/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Inject, forwardRef, ChangeDetectorRef } from '@angular/core';
import * as chartjs from 'chart.js';
import { mixin } from 'sql/base/common/objects';
import { Disposable } from 'vs/base/common/lifecycle';
//import { BubbleChartPoint, ChartOptions, ScatterChartPoint } from 'azdata';
import * as azdata from 'azdata';

// nned to rename to match a common chart dataset
export interface BarDataSet {
	label: string;
	data: number[];
	backgroundColor?: string[];
	borderColor?: string[];
}

@Component({
	selector: 'chart-component',
	templateUrl: decodeURI(require.toUrl('./chart.component.html'))
})
export class Chart<T extends azdata.ChartProperties> extends Disposable {

	private _labels: string[];
	private _type: any;
	//private _data: number[] | BubbleChartPoint[] | ScatterChartPoint[];
	//private _colors: string | string[];
	//private _datasetLabel: string;
	//private _borderColor: string | string[];
	public chart: any;
	private _datasets: any;


	private _options: any = {
		events: ['click', 'keyup'],
		responsive: true,
		maintainAspectRatio: false
	};

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef
	) {
		chartjs.Chart.register(...chartjs.registerables);
		super();
	}

	ngAfterViewInit(): void {

	}

	public set type(val: any) {
		if (val === 'horizontalBar') {
			this._type = 'bar';
			this._options = mixin({}, mixin(this._options, { indexAxis: 'y' }));
		}
		else {
			this._type = val;
		}
		this._changeRef.detectChanges();
	}

	public set chartCongif(val: any) {
		if (this._type === 'bar' || this._type === 'line') {
			let BarDataSets: BarDataSet[] = [];
			for (let dataset of val.datasets) {
				var BarDataSet: BarDataSet = { label: '', data: [] };
				BarDataSet.label = dataset.datasetLabel;
				let dataEntry = dataset.data;
				this._labels = [];
				for (let dataEntryPoint of dataEntry) {
					this._labels.push(dataEntryPoint.xLabel);
					BarDataSet.data.push(dataEntryPoint.value);
					if (dataEntryPoint.backgroundColor) {
						BarDataSet.backgroundColor.push(dataEntryPoint.backgroundColor);
					}
					if (dataEntryPoint.borderColor) {
						BarDataSet.borderColor.push(dataEntryPoint.borderColor);
					}
				}
				BarDataSets.push(BarDataSet);
			}
			this._datasets = BarDataSets;
		}
		else if (this._type === 'doughnut' || this.type === 'pie') {
			let BarDataSet: BarDataSet = { label: '', data: [] };
			BarDataSet.label = val.dataset.datasetLabel;
			let dataEntry = val.dataset.data;
			this._labels = [];
			for (let dataEntryPoint of dataEntry) {
				this._labels.push(dataEntryPoint.xLabel);
				BarDataSet.data.push(dataEntryPoint.value);
				if (dataEntryPoint.backgroundColor) {
					BarDataSet.backgroundColor.push(dataEntryPoint.backgroundColor);
				}
				if (dataEntryPoint.borderColor) {
					BarDataSet.borderColor.push(dataEntryPoint.borderColor);
				}
			}
			this._datasets = BarDataSet;
		}

		if (val.options) {
			this.options = val.options;
		}
	}

	/*public set data(val: any) {
		this._data = val.dataset;
		if (val.labels) {
			this._labels = val.labels;
		}
		if (val.colors) {
			this._colors = val.colors;
		}
		if (val.label) {
			this._datasetLabel = val.label;
		}
		if (val.borderColor) {
			this._borderColor = val.borderColor;
		}
	}*/

	public set options(val: any) {
		if (val) {
			this._options = mixin({}, mixin(this._options, val));
		}
		this.drawChart();
	}

	public drawChart() {
		this.chart = new chartjs.Chart("MyChart", {
			type: this._type,
			plugins: [plugin],
			data: {
				labels: this._labels,
				/*datasets: [
					{
						label: this._datasetLabel,
						data: this._data,
						backgroundColor: this._colors,
						borderColor: this._borderColor
					}
				]*/
				datasets: this._datasets
			},
			options: this._options
		});
	}
}

const setActiveElements = function (chart, index) {
	chart.setActiveElements([
		{
			datasetIndex: 0,
			index,
		}
	]);
	chart.update();
};

const currentActiveElement = function (elements) {
	if (elements.length) {
		return elements[0].index;
	}
	return -1;
};

const dispatchClick = function (chart, point) {
	const node = chart.canvas;
	const rect = node.getBoundingClientRect();
	const event = new MouseEvent('click', {
		clientX: rect.left + point.x,
		clientY: rect.top + point.y,
		cancelable: true,
		bubbles: true,
		//view: window
	});
	node.dispatchEvent(event);
}

const plugin = {
	id: 'keyup',
	defaults: {
		events: ['keyup']
	},
	beforeEvent(chart, args, options) {
		const event = args.event;
		const code = event.native.code;
		const activeElements = chart.getActiveElements();
		const tooltip = chart.tooltip;
		if (code === 'ArrowRight') {
			const pos = currentActiveElement(activeElements) + 1;
			const index = pos === chart.data.datasets[0].data.length ? 0 : pos;
			setActiveElements(chart, index);
			setActiveElements(tooltip, index);
		} else if (code === 'ArrowLeft') {
			const pos = currentActiveElement(activeElements) - 1;
			const index = pos < 0 ? chart.data.datasets[0].data.length - 1 : pos;
			setActiveElements(chart, index);
			setActiveElements(tooltip, index);
		} else if (code === 'Enter' && activeElements.length) {
			const el = activeElements[0];
			const meta = chart.getDatasetMeta(el.datasetIndex);
			const data = meta.data[el.index];
			dispatchClick(chart, data);
		}
		return false;
	}
};
