import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostBinding, Input, ViewChild } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { BrowserJsPlumbInstance } from '@jsplumb/browser-ui';
import { BezierConnector } from '@jsplumb/connector-bezier';
import { DotEndpoint, EndpointOptions } from '@jsplumb/core';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { NodeService } from '../node.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/dialog.component';
import { NavigationStart, Router, RouterEvent } from '@angular/router';
import { FormControl, FormGroup, Validators, FormBuilder, FormArray } from '@angular/forms';

export interface Node {
    id: string;
    type: string;
    cor: any;
}

@Component({
    selector: 'app-dynamic-node',
    templateUrl: './dynamic-node.component.html',
    styleUrls: ['./dynamic-node.component.scss'],
    host: {
        '[id]': 'node.id',
        '[attr.data]': 'node.type'
    }
})
export class DynamicNodeComponent implements AfterViewInit {

    nodeForm = new FormGroup({});
    componentNameControl = new FormControl({ value: "", disabled: true });
    componentNameSubscription = new Subscription();

    attributeList: any[] = [];
    referenceId = -1;
    dialogRef: MatDialogRef<DialogComponent>;

    public top: any = 0;
    public left: any = 0;
    public show = false;
    public title = "";

    @Input() node!: Node;
    @Input() formData!: any;
    @Input() jsPlumbInstance: BrowserJsPlumbInstance;
    router: any;

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
        public nodeService: NodeService,
        private readonly hostElementRef: ElementRef,
        public dialog: MatDialog) { 
        }
    ngOnInit() {
        this.top = this.node.cor.y;
        this.left = this.node.cor.x;

        this.componentNameControl.setValue(this.node.type);
        this.componentNameSubscription = this.componentNameControl.valueChanges.pipe(
            debounceTime(350),
            distinctUntilChanged()
        ).subscribe(value => {
            this.nodeForm.patchValue({ "component_name": value });
            this.save();
        });

        this.nodeService.removeAllNode.subscribe((information) => {
            this.nodeRemove();
        });

        this.jsPlumbInstance.bind('connection', info => {
            if (info.targetId === this.node.id) {
                if (this.referenceId !== -1) {
                    this.fetchNodeReference();
                }
            }
        });
        this.jsPlumbInstance.bind('connection:detach', info => {
            if (info.targetId === this.node.id) {
                if (this.referenceId !== -1) {
                    setTimeout(() => {
                        this.fetchNodeReference();
                    }, 200);
                }
            }
        });
        // if(this.node.type=='Custom'){ 
        //     this.nodeForm = this.formBuilder.group({
        //     customArguments: this.formBuilder.array([this.newCustomArgument()])
            

        // });}
       
        
    }

    get nodeElement() {
        return this.hostElementRef.nativeElement;
    }

    getNodeElement() {
        return this.nodeElement;
    }

    ngAfterViewInit() {

        if (this.node.type == 'Join' || this.node.type == 'Union' || this.node.type == 'Aggregate' ||this.node.type == 'Scan' || this.node.type == 'Sort'
            || this.node.type == 'Partition' || this.node.type == 'Rollup' || this.node.type == 'Metapivot' || this.node.type == 'Concatenation'
            || this.node.type == 'Lookup_Select_Join' || this.node.type == 'Lookup_Select' || this.node.type == 'Intermediate_files' || this.node.type == 'Normalize'
            || this.node.type == 'Merge' || this.node.type == 'Gather' || this.node.type == 'Fuse' || this.node.type == 'XML_split'
            || this.node.type == 'XML_combin' || this.node.type == 'Repair_Input' || this.node.type == 'Redefine_Format' || this.node.type == 'Split'
            || this.node.type == 'Generate_Records' || this.node.type == 'Create_data' || this.node.type == 'Dedup_sort' || this.node.type == 'Leading_Records'
            || this.node.type == 'Reformat' || this.node.type == 'AddColumn' || this.node.type == 'Lookup_And_Replace'
        ) {
            this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.nodeElement,
                [{ anchor: 'Left', uuid: this.node.id + 'left' }, { anchor: 'Top', uuid: this.node.id + 'top' }], this.destination);

            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.nodeElement,
                { anchor: 'Right', uuid: this.node.id + 'right' }, this.source);
        }
        else if (this.node.type == 'Filter' || this.node.type == 'Lookup' || this.node.type == 'Sort') {
            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.nodeElement,
                { anchor: 'Right', uuid: this.node.id + 'right' }, this.source);
            this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.nodeElement,
                [{ anchor: 'Left', uuid: this.node.id + 'left' }], this.destination);
        }
        else if (this.node.type == 'Input') {
            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.nodeElement,
                { anchor: 'Right', uuid: this.node.id + 'right' }, this.source);
        }
        else if (this.node.type == 'Write' || this.node.type=='Pivot') {
            this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.nodeElement,
                [{ anchor: 'Left', uuid: this.node.id + 'left' }], this.destination);
        }
        else {
            this.sourceEndPoint = this.jsPlumbInstance.addEndpoint(this.nodeElement,
                { anchor: 'Right', uuid: this.node.id + 'right' }, this.source);
            if (this.node.type !== 'start') {
                this.destinationEndPoint = this.jsPlumbInstance.addEndpoints(this.nodeElement,
                    [{ anchor: 'Left', uuid: this.node.id + 'left' }, { anchor: 'Top', uuid: '4233' + 'top' }], this.destination);
            }
        }
        this.jsPlumbInstance.setDraggable(this.nodeElement, true);

        this.generateForm();
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

    changePropertyType(e: any, item) {

        // Remove previous type properties
        if (item.selectedIndex != null && item.selectedIndex > -1) {
            (item.optionProperties[item.options[item.selectedIndex]] as [])?.forEach((property: any) => {
                this.attributeList.splice(this.attributeList.findIndex(attr => attr.name === property.name), 1);
                this.nodeForm.removeControl(property.name);
            });
        }

        // Add new type properties
        (item.optionProperties[e.value] as [])?.forEach((property: any) => {
            this.attributeList.push(property);
            this.createFormControl(property);
        });

        item.selectedIndex = item.options?.findIndex(option => option === e.value);

        this.cdRef.detectChanges();
    }

    createFormControl(da) {
        if (da.type == 'boolean') {
            this.nodeForm.addControl(da.name, new FormControl(da.value || false, []));
        } else if (da.type == 'array') {
            this.nodeForm.addControl(da.name, new FormControl(da.value || [], []));
            if (this.formData?.[da.name]) {
                da.value = this.formData?.[da.name];
            }
        } else {
            this.nodeForm.addControl(da.name, new FormControl(da.value || '', []));
        }
        if (da.type === "propertyType") {
            let selectedType;

            if (da.selectedIndex != null && da.selectedIndex > -1) {
                selectedType = da.options[da.selectedIndex];
            }
            if (this.formData != null && this.formData[da.name] != null) {
                selectedType = this.formData[da.name];
            }
            if (selectedType) {
                this.nodeForm.patchValue({ [da.name]: selectedType });
                if (da.optionProperties && da.optionProperties[selectedType]?.length) {
                    this.attributeList.push(...da.optionProperties[selectedType]);
                }
            }
        }
        if (da.required) {
            this.nodeForm.controls[da.name].addValidators(Validators.required);
        }
        if (da.readOnly) {
            this.nodeForm.controls[da.name].disable();
        }
    }

    generateForm() {
        this.nodeService.getJSON(this.node.type).subscribe((data) => {
            if (data[this.node.type].length) {
                this.title = this.node.type;
                this.attributeList = JSON.parse(JSON.stringify(data[this.node.type]));

                for (let index = 0; index < this.attributeList.length; index++) {
                    let da = this.attributeList[index];

                    this.createFormControl(da);

                    if (da.name === 'component_type' || da.name === "component_name") {
                        this.nodeForm.patchValue({ [da.name]: this.node.type });
                    }
                    else if (da.name === 'id') {
                        this.nodeForm.patchValue({ "id": this.node.id });
                    }

                    if (da.name === "node_reference") {
                        this.referenceId = index;
                    }
                    this.nodeForm.controls[da.name].updateValueAndValidity();
                };
            }
            if (this.formData != undefined) {
                this.nodeForm.patchValue(this.formData);
                if (this.referenceId > -1) {
                    this.attributeList[this.referenceId].value = [""];
                    this.nodeForm.patchValue({ "node_reference": [""] });
                }
            }
        });
        this.save();
        this.cdRef.detectChanges();
    }
    // createFormControl(da) {
    //     // console.log("Create Form Constrol")
    //      if (da.type == 'boolean') {
    //          this.nodeForm.addControl(da.name, new FormControl(da.value || false, []));
    //          console.log(this.nodeForm);
    //      } else if (da.type == 'array') {
    //          this.nodeForm.addControl(da.name, new FormControl(da.value || [], []));
    //          if (this.formData?.[da.name]) {
    //              da.value = this.formData?.[da.name];
    //          }
    //      }
    //      else if (da.type == 'multiplekeyvalue') {
    //          this.nodeForm.addControl(da.name, new FormArray([], []));
    //      }
    //      else {
    //          this.nodeForm.addControl(da.name, new FormControl(da.value || '', []));
    //      }
    //      if (da.type === "propertyType") {
    //          let selectedType;
 
    //          if (da.selectedIndex != null && da.selectedIndex > -1) {
    //              selectedType = da.options[da.selectedIndex];
    //          }
    //          if (this.formData != null && this.formData[da.name] != null) {
    //              selectedType = this.formData[da.name];
    //          }
    //          if (selectedType) {
    //              this.nodeForm.patchValue({ [da.name]: selectedType });
    //              if (da.optionProperties && da.optionProperties[selectedType]?.length) {
    //                  this.attributeList.push(...da.optionProperties[selectedType]);
    //              }
    //              da.selectedIndex = da.options?.findIndex(option => option === selectedType);
    //          }
    //      }
    //      if (da.required) {
    //          this.nodeForm.controls[da.name].addValidators(Validators.required);
    //      }
    //      if (da.readOnly) {
    //          this.nodeForm.controls[da.name].disable();
    //      }
    //      console.log(this.nodeForm);
    //  }
 
    //  generateForm() {
    //      this.nodeService.getJSON(this.node.type).subscribe((data) => {
    //          if (data[this.node.type].length) {
    //              this.title = this.node.type;
    //              this.attributeList = JSON.parse(JSON.stringify(data[this.node.type]));
 
    //              for (let index = 0; index < this.attributeList.length; index++) {
    //                  let da = this.attributeList[index];
 
    //                  this.createFormControl(da);
 
    //                  if (da.name === 'component_type' || da.name === "component_name") {
    //                      this.nodeForm.patchValue({ [da.name]: this.node.type });
    //                  }
    //                  else if (da.name === 'id') {
    //                      this.nodeForm.patchValue({ "id": this.node.id });
    //                  }
 
    //                  if (da.name === "node_reference") {
    //                      this.referenceId = index;
    //                  }
    //                  this.nodeForm.controls[da.name].updateValueAndValidity();
    //              };
    //          }
    //          if (this.formData != undefined) {
 
    //              let values: any[] = this.formData["customArguments"];
    //              if (values) {
    //                  let control: FormArray = this.nodeForm.controls["customArguments"] as FormArray;
    //                  if (control) {
    //                      values.forEach((value, index) => {
    //                          if (index) {
    //                              control.push(this.newCustomArgument());
    //                          }
    //                      });
    //                  }
    //              }
 
    //              this.nodeForm.patchValue(this.formData);
    //              if (this.referenceId > -1) {
    //                  //this.attributeList[this.referenceId].value = [""];
    //                  //this.nodeForm.patchValue({ "node_reference": [""] });
    //                  this.nodeForm?.patchValue({ "node_reference": this.attributeList[this.referenceId].value });
    //              }
    //          }
    //      });
 
    //      this.save();
    //      this.cdRef.detectChanges();
    //  }

    fetchNodeReference() {
        let nodeReferenceList: any[] = [""];

        let sourceIds: any[] = [];

        this.jsPlumbInstance.getEndpoints(this.nodeElement)
            .filter(ep => ep["isTarget"])
            .map((ep) => ep.connections?.filter(connection => connection.targetId === this.node.id))
            .forEach(connections => {
                connections?.forEach(connection => sourceIds.push(connection.sourceId))
            });

        if (sourceIds.length) {
            nodeReferenceList = sourceIds;
        }

        this.attributeList[this.referenceId].value = nodeReferenceList;
        this.nodeForm.patchValue({ "node_reference": nodeReferenceList });
        this.saveNodeFormData();
    }

    // newCustomArgument(): FormGroup {
    //     return this.formBuilder.group({
    //         key: '',
    //         value: '',
    //     })
    // }


    editNode() {
        console.log(this.node.id);
        this.nodeForm.patchValue(this.formData);
        // this.fetchNodeReference();
        if (this.referenceId > -1) {
            this.nodeForm?.patchValue({ "node_reference": this.attributeList[this.referenceId].value });
        }

        // this.show = true;
        this.dialogRef = this.dialog.open(DialogComponent, {
            // minWidth: '50px',
            // minHeight:'100px',
            width: '375px',
            height: '560px',
            disableClose:true,
            closeOnNavigation:true,
            //hasBackdrop: false,
            position: { right: '0', top: '55px' },
            data: {
                node: this.node,
                jsPlumbInstance: this.jsPlumbInstance,
                formData: this.formData,
                nodeForm: this.nodeForm,
                
            }
        });
        

        this.dialogRef.beforeClosed().subscribe(result => {
           // console.log(result.value);
            this.formData = result?.value;
            this.nodeForm.patchValue(this.formData);
            //this.fetchNodeReference();
            // this.patchFormValues();
        });
      
    }
 
    save() {

        this.componentNameControl.setValue(this.nodeForm.get("component_name")?.value);
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
        this.nodeForm.patchValue({ "component_type": this.node.type });
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

