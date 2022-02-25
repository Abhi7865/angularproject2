import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostBinding, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { BrowserJsPlumbInstance } from '@jsplumb/browser-ui';
import { BezierConnector } from '@jsplumb/connector-bezier';
import { DotEndpoint, EndpointOptions } from '@jsplumb/core';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Node1Service } from '../node1.service';

export interface Node {
    uniqueId: string;
    id: string;
    type: string;
    cor: any;
}

@Component({
    selector: 'app-dynamicnode1',
    templateUrl: './dynamicnode1.component.html',
    styleUrls: ['./dynamicnode1.component.scss'],
    host: {
        '[id]': 'node.uniqueId',
        '[attr.data]': 'node.type'
    }
})
export class Dynamicnode1Component implements AfterViewInit {

    nodeForm = new FormGroup({});
    componentNameControl = new FormControl({ value: "", disabled: true });
    componentNameSubscription = new Subscription();

    attributeList: any[] = [];
    referenceId = -1;

    public top: any = 0;
    public left: any = 0;
    public show = false;
    public title = "";

    @Input() node!: Node;
    @Input() formData!: any;
    @Input() jsPlumbInstance: BrowserJsPlumbInstance;

    @HostBinding('style.top.px')
    get topPosition(): number {
        return this.top;
    }
    @HostBinding('style.left.px')
    get leftPosition(): number {
        return this.left;
    }

    @ViewChild("nodeDiv") nodeDiv: ElementRef;

    sourceEndPoint: any;
    destinationEndPoint: any;
    exampleDropOptions = {
        tolerance: 'touch',
        hoverClass: 'dropHover',
        activeClass: 'dragActive'
    };
    source: EndpointOptions = {
        endpoint: { type: DotEndpoint.type, options: { radius: 5 } },
        paintStyle: { fill: '#7030A0' },
        source: true,
        // scope: 'jsPlumb_defaultscope',
        connectorStyle: { stroke: '#7030A0', strokeWidth: 3 },
        connector: { type: BezierConnector.type, options: { curviness: 63 } },
        maxConnections: 2,
        target: false,
        connectorOverlays: [{ type: 'Arrow', options: { location: 1 } }],
        // dropOptions: this.exampleDropOptions
    };
    destination: EndpointOptions = {
        endpoint: { type: DotEndpoint.type, options: { radius: 5 } },
        paintStyle: { fill: '#E38C00' },
        source: false,
        // scope: 'jsPlumb_defaultscope',
        connectorStyle: { stroke: '#E38C00', strokeWidth: 6 },
        connector: { type: BezierConnector.type, options: { curviness: 23 } },
        maxConnections: 2,
        target: true,
        // dropOptions: this.exampleDropOptions
    };
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    constructor(
        private cdRef: ChangeDetectorRef,
        public nodeService: Node1Service,
        private readonly hostElementRef: ElementRef) { }

    ngOnInit() {
        this.top = this.node.cor.y;
        this.left = this.node.cor.x;

        this.componentNameControl.setValue(this.node.type);
        this.componentNameSubscription = this.componentNameControl.valueChanges.pipe(
            debounceTime(350),
            distinctUntilChanged()
        ).subscribe(value => {
            this.nodeForm.patchValue({ "task_Name": value });
            this.save();
        });

        this.nodeService.removeAllNode.subscribe((information) => {
            this.nodeRemove();
        });

        this.nodeService.jsPlumbInstance.bind('connection', info => {
            if (info.targetId === this.node.uniqueId) {
                if (this.referenceId !== -1) {
                    this.fetchNodeReference();
                }
            }
        });
        this.nodeService.jsPlumbInstance.bind('connection:detach', info => {
            if (info.targetId === this.node.uniqueId) {
                if (this.referenceId !== -1) {
                    setTimeout(() => {
                        this.fetchNodeReference();
                    }, 200);
                }
            }
        });
    }

    get nodeElement() {
        return this.hostElementRef.nativeElement;
    }

    getNodeElement() {
        return this.nodeElement;
    }


    ngAfterViewInit() {

        if (this.node.type == 'Join' || this.node.type == 'Scan' || this.node.type == 'Sort'
            || this.node.type == 'Partition' || this.node.type == 'Rollup' || this.node.type == 'Metapivot' || this.node.type == 'Concatenation'
            || this.node.type == 'Lookup_Select_Join' || this.node.type == 'Lookup_Select' || this.node.type == 'Intermediate_files' || this.node.type == 'Normalize'
            || this.node.type == 'Merge' || this.node.type == 'Gather' || this.node.type == 'Fuse' || this.node.type == 'XML_split'
            || this.node.type == 'XML_combin' || this.node.type == 'Repair_Input' || this.node.type == 'Redefine_Format' || this.node.type == 'Split'
            || this.node.type == 'Generate_Records' || this.node.type == 'Create_data' || this.node.type == 'Dedup_sort' || this.node.type == 'Leading_Records'
            || this.node.type == 'Reformat' || this.node.type == 'AddColumn' || this.node.type == 'Lookup_And_Replace'
        ) {
            this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.nodeElement,
                [{ anchor: 'Left', uuid: this.node.uniqueId + 'left' }, { anchor: 'Top', uuid: this.node.uniqueId + 'top' }], this.destination);

            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.nodeElement,
                { anchor: 'Right', uuid: this.node.uniqueId + 'right' }, this.source);
        }
        else if (this.node.type == 'Filter' || this.node.type == 'Lookup' || this.node.type == 'Sort') {
            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.nodeElement,
                { anchor: 'Right', uuid: this.node.uniqueId + 'right' }, this.source);
            this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.nodeElement,
                [{ anchor: 'Left', uuid: this.node.uniqueId + 'left' }], this.destination);
        }
        else if (this.node.type == 'Input') {
            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.nodeElement,
                { anchor: 'Right', uuid: this.node.uniqueId + 'right' }, this.source);
        }
        else if (this.node.type == 'Write') {
            this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.nodeElement,
                [{ anchor: 'Left', uuid: this.node.uniqueId + 'left' }], this.destination);
        }
        else {
            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.nodeElement,
                { anchor: 'Right', uuid: this.node.uniqueId + 'right' }, this.source);
            if (this.node.type !== 'start') {
                this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.nodeElement,
                    [{ anchor: 'Left', uuid: this.node.uniqueId + 'left' }, { anchor: 'Top', uuid: '4233' + 'top' }], this.destination);
            }
        }
        this.jsPlumbInstance.setDraggable(this.nodeElement, true);

        this.generateForm();
    }

    ngAfterViewChecked() {
        // this.cdRef.detectChanges();
        this.nodeService.checkDescription();
    }

    ngOnDestroy() {
        this.componentNameSubscription.unsubscribe();
    }

    allowNodeEdit() {
        this.componentNameControl.enable();
    }

    removeNode() {
        this.jsPlumbInstance.removeAllEndpoints(this.nodeElement);
        this.jsPlumbInstance._removeElement(this.nodeElement);
        this.nodeService.deleteNode(this.node.id);
    }

    generateForm() {
        this.nodeService.getJSON("Task").subscribe((data) => {
            if (data["Task"].length) {
                this.title = "Task";
                this.attributeList = JSON.parse(JSON.stringify(data["Task"]));

                this.attributeList.forEach((da: any, index) => {
                    if (da.type == 'boolean') {
                        this.nodeForm.addControl(da.name, new FormControl(da.value || false));
                    } else if (da.type == 'array') {
                        this.nodeForm.addControl(da.name, new FormControl(da.value || []));
                        if (this.formData?.[da.name]) {
                            da.value = this.formData?.[da.name];
                        }
                    } else {
                        this.nodeForm.addControl(da.name, new FormControl(da.value || ''));
                    }

                    if (da.required) {
                        this.nodeForm.controls[da.name].addValidators(Validators.required);
                    }
                    if (da.readOnly) {
                        this.nodeForm.controls[da.name].disable();
                    }

                    if (da.name === 'task_Name' || da.name === 'task_filename') {
                        this.nodeForm.patchValue({ [da.name]: this.node.type });
                    }
                    else if (da.name === 'id') {
                        this.nodeForm.patchValue({ "id": this.node.id });
                    }

                    if (da.name === "task_node_reference") {
                        this.referenceId = index;
                    }
                    this.nodeForm.controls[da.name].updateValueAndValidity();
                });
            }

            if (this.formData != undefined) {
                this.nodeForm.patchValue(this.formData);
                if (this.referenceId > -1) {
                    this.attributeList[this.referenceId].value = [""];
                    this.nodeForm.patchValue({ "task_node_reference": [""] });
                }
            }
        });
        this.save();
        this.cdRef.detectChanges();
    }

    fetchNodeReference() {
        let nodeReferenceList: any[] = [""];

        let sourceIds: any[] = [];

        this.jsPlumbInstance.getEndpoints(this.nodeElement)
            .filter(ep => ep["isTarget"])
            .map((ep) => ep.connections?.filter(connection => connection.targetId === this.node.uniqueId))
            .forEach(connections => {
                connections?.forEach(connection => sourceIds.push(connection.sourceId))
            });

        if (sourceIds.length) {
            nodeReferenceList = sourceIds.map(sourceId => this.nodeService.nodes.find((n: any) => n.uniqueId == sourceId)?.id);
        }

        this.attributeList[this.referenceId].value = nodeReferenceList;
        this.nodeForm.patchValue({ "task_node_reference": nodeReferenceList });
        this.saveNodeFormData();
    }


    editNode() {
        this.nodeForm.patchValue(this.formData);
        // this.fetchNodeReference();
        if (this.referenceId > -1) {
            this.nodeForm?.patchValue({ "task_node_reference": this.attributeList[this.referenceId].value });
        }

        this.show = true;
    }

    save() {
        this.componentNameControl.setValue(this.nodeForm.get("task_Name")?.value);
        this.saveNodeFormData();
        this.show = false;
    }

    saveNodeFormData() {
        this.formData = this.nodeForm.getRawValue();
        this.nodeService.updateNodeFormData(this.node.id, this.nodeForm.getRawValue());
    }

    close() {
        this.show = false;
    }
    resetValue() {
        this.nodeForm.reset();
        this.nodeForm.patchValue({ "task_filename": this.node.type });
        this.nodeForm.patchValue({ "id": this.node.id });
    }
    nodeRemove() {
        this.nodeService.getNodeList().then((data: any) => {
            data.map((da: any) => {
                this.jsPlumbInstance.removeAllEndpoints(this.nodeElement);
                this.jsPlumbInstance._removeElement(this.nodeElement);
            })
            this.jsPlumbInstance.reset();
        })
    }

    removeValueFromArray(value: string, values: string[]) {
        let index = values.findIndex(v => v === value);
        if (index !== -1) {
            values.splice(index, 1);
        }
    }

    addKeywordFromInput(event: MatChipInputEvent, values: string[]) {
        if (event.value) {
            values.push(event.value);
            event.chipInput!.clear();
        }
    }

    highlightNode() {
        this.nodeDiv.nativeElement.classList.add('highlight');
        setTimeout(() => {
            this.nodeDiv.nativeElement.classList.remove('highlight');
        }, 2000);

    }
}

