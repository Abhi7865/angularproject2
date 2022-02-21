import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AfterViewInit, ChangeDetectorRef, Component, HostBinding, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Node1Service } from '../node1.service';

export interface Node {
    id: string;
    type: string;
    cor: any;
}

@Component({
    selector: 'app-dynamicnode1',
    templateUrl: './dynamicnode1.component.html',
    styleUrls: ['./dynamicnode1.component.scss'],
    host: {
        '[id]': 'node.id',
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
    @Input() jsPlumbInstance;

    @HostBinding('style.top.px')
    get topPosition(): number {
        return this.top;
    }
    @HostBinding('style.left.px')
    get leftPosition(): number {
        return this.left;
    }

    sourceEndPoint: any;
    destinationEndPoint: any;
    exampleDropOptions = {
        tolerance: 'touch',
        hoverClass: 'dropHover',
        activeClass: 'dragActive'
    };
    source = {
        endpoint: ['Dot', { radius: 5 }],
        paintStyle: { fill: '#7030A0'},
        isSource: true,
        scope: 'jsPlumb_DefaultScope',
        connectorStyle: { stroke: '#7030A0', strokeWidth: 3 },
        connector: ['Bezier', { curviness: 63 }],
        maxConnections: 2,
        isTarget: false,
        connectorOverlays: [['Arrow', { location: 1 }]],
        dropOptions: this.exampleDropOptions
    };
    destination = {
        endpoint: ['Dot', { radius: 5 }],
        paintStyle: { fill: '#E38C00' },
        isSource: false,
        scope: 'jsPlumb_DefaultScope',
        connectorStyle: { stroke: '#E38C00', strokeWidth: 6 },
        connector: ['Bezier', { curviness: 23 }],
        maxConnections: 2,
        isTarget: true,
        dropOptions: this.exampleDropOptions
    };
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    constructor(private cdRef: ChangeDetectorRef, public nodeService: Node1Service) { }

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
            if (info.targetId === this.node.id) {
                console.log(info.source.getAttribute("data"));

                if (this.referenceId !== -1) {
                    this.fetchNodeReference();
                }
            }
        });
        this.nodeService.jsPlumbInstance.bind('connectionDetached', info => {
            if (info.targetId === this.node.id) {
                console.log(info.source.getAttribute("data"));

                if (this.referenceId !== -1) {
                    setTimeout(() => {
                        this.fetchNodeReference();
                    }, 200);
                }
            }
        });
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
            this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.node.id,
                [{ anchor: 'Left', uuid: this.node.id + 'left' }, { anchor: 'Top', uuid: this.node.id + 'top' }], this.destination);

            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.node.id,
                { anchor: 'Right', uuid: this.node.id + 'right' }, this.source);
        }
        else if (this.node.type == 'Filter' || this.node.type == 'Lookup' || this.node.type == 'Sort') {
            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.node.id,
                { anchor: 'Right', uuid: this.node.id + 'right' }, this.source);
            this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.node.id,
                [{ anchor: 'Left', uuid: this.node.id + 'left' }], this.destination);
        }
        else if (this.node.type == 'InputRead') {
            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.node.id,
                { anchor: 'Right', uuid: this.node.id + 'right' }, this.source);
        }
        else if (this.node.type == 'WriteOutput') {
            this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.node.id,
                [{ anchor: 'Left', uuid: this.node.id + 'left' }], this.destination);
        }
        else {
            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.node.id,
                { anchor: 'Right', uuid: this.node.id + 'right' }, this.source);
            if (this.node.type !== 'start') {
                this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.node.id,
                    [{ anchor: 'Left', uuid: this.node.id + 'left' }, { anchor: 'Top', uuid: '4233' + 'top' }], this.destination);
            }
        }
        this.jsPlumbInstance.draggable(this.node.id);

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

    removeNode(node: any) {
        this.jsPlumbInstance.removeAllEndpoints(node.id);
        this.jsPlumbInstance.remove(node.id);
        this.nodeService.deleteNode(node.id);

    }

    generateForm() {
        this.nodeService.getJSON("Task").subscribe((data) => {
            if (data["Task"].length) {
                this.title = "Task";
                this.attributeList = JSON.parse(JSON.stringify(data["Task"]));

                this.attributeList.forEach((da: any, index) => {
                    if (da.type == 'boolean') {
                        this.nodeForm.addControl(da.name, new FormControl(false, []));
                    } else if (da.type == 'array') {
                        this.nodeForm.addControl(da.name, new FormControl(da.value || [], []));
                        if (this.formData?.[da.name]) {
                            da.value = this.formData?.[da.name];
                        }
                    } else {
                        this.nodeForm.addControl(da.name, new FormControl('', []));
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
                });
            }

            if (this.formData != undefined) {
                this.nodeForm.patchValue(this.formData);
                if (this.referenceId > -1) {
                    this.nodeForm.patchValue({ "task_node_reference": [""] });
                }
            }
        });
        this.save();
    }

    fetchNodeReference() {
        let nodeReferenceList: any[] = [""];

        let sourceIds: any[] = [];

        this.nodeService.jsPlumbInstance.getEndpoints(this.node.id)
            .filter(ep => ep["isTarget"])
            .map((ep) => ep.connections?.filter(connection => connection.targetId === this.node.id))
            .forEach(connections => {
                connections?.forEach(connection => sourceIds.push(connection.sourceId))
            });

        if (sourceIds.length) {
            nodeReferenceList = sourceIds;
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
                this.jsPlumbInstance.removeAllEndpoints(da.id);
                this.jsPlumbInstance.remove(da.id);
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
}
