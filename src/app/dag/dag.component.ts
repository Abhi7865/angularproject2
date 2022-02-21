import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { fileOpen, FileWithHandle } from 'browser-fs-access';
import { NodeService } from '../node/node.service';
import { Node1Component } from '../node1/node1.component';
import { Node1Service } from '../node1/node1.service';

@Component({
    selector: 'app-dag',
    templateUrl: './dag.component.html',
    styleUrls: ['./dag.component.scss']
})
export class DagComponent implements OnInit {

    nodes: any[] = [];
    files: any[] = [];
    @ViewChild('nodeChild') nodeChild: Node1Component;

    index = 0;
    popupTittle = "";
    typeofFlow = 'task';
    taskList: any = [];

    public componentlist: any = {};
    public commonworkflowlist: any = {};
    nodeForm = new FormGroup({});

    formComponentData;

    public show = false;
    public title = "";
    currentData: any = "";

    uploadedFileWithHandler: FileWithHandle;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    constructor(
        private cdRef: ChangeDetectorRef,
        private nodeService: NodeService,
        private node1Service: Node1Service) { }

    ngOnInit() {
        this.nodeService.updateNodeList.subscribe((information) => {
            this.taskList = information;
            console.log(this.taskList);

        });
        this.node1Service.changeflowSub.subscribe((data) => {
            this.changeFlow(data);
        });

        this.node1Service.getJSON('').subscribe((data) => {
            this.componentlist = data;

        });
    }

    ngAfterViewInit() {
        this.node1Service.getcommonJSON('').subscribe((data) => {
            this.commonworkflowlist = data.commonworkflow;
            this.generateWorkflowForm();
        });
    }

    create(cor: any) {

        const n = {
            id: (this.index + 1).toString(),
            // name: this.popupTittle,
            type: this.popupTittle,
            cor: cor,

        };

        this.index += 1;
        this.nodeChild.addDynamicNodes(n, {});
        this.node1Service.maintainJason(n, {});
        this.nodes.push(n);
    }

    onItemDrop(event: any) {
        this.popupTittle = (event.data as string).replace(".json", "");
        const screen = { "x": event.event.offsetX - 75, 'y': event.event.offsetY - 25 };
        this.create(screen);
    }

    onFileDropped(event: any) {
        this.prepareFilesList(event);
    }

    /**
     * handle file from browsing
     */
    fileBrowseHandler(event: any) {

        //this.prepareFilesList(files);
        for (var i = 0; i < event.target.files.length; i++) {
            let filename: string = event.target.files[i].name;
            filename = filename.replace(".json", "");

            this.files.push(filename);
        }
    }

    /**
     * Delete file from files list
     * @param index (File index)
     */
    deleteFile(index: number) {
        this.files.splice(index, 1);
    }

    /**
     * Simulate the upload process
     */
    uploadFilesSimulator(index: number) {
        setTimeout(() => {
            if (index === this.files.length) {
                return;
            } else {
                const progressInterval = setInterval(() => {
                    if (this.files[index].progress === 100) {
                        clearInterval(progressInterval);
                        this.uploadFilesSimulator(index + 1);
                    } else {
                        this.files[index].progress += 5;
                    }
                }, 200);
            }
        }, 1000);
    }

    /**
     * Convert Files list to normal array list
     * @param files (Files List)
     */
    prepareFilesList(files: Array<any>) {
        for (const item of files) {
            item.progress = 0;
            this.files.push(item);
        }
        this.uploadFilesSimulator(0);
    }

    /**
     * format bytes
     * @param bytes (File size in bytes)
     * @param decimals (Decimals point)
     */
    // formatBytes(bytes: number, decimals: number) {
    //     if (bytes === 0) {
    //         return '0 Bytes';
    //     }
    //     const k = 1024;
    //     const dm = decimals <= 0 ? 0 : decimals || 2;
    //     const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    //     const i = Math.floor(Math.log(bytes) / Math.log(k));
    //     return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    // }

    //entire workflow
    saveJson(overwrite = false) {
        this.node1Service.downloadJson(overwrite);
    }

    changeFlow(val: any) {

        this.typeofFlow = val.value;
        if (val.value == 'workflow') {
            this.taskList = [];
            this.node1Service.removeAllTaskList();
            this.node1Service.getTempWorkFlowJson().then((data) => {

                this.import(data);
            });

        } else {

            this.node1Service.removeAllNOde();
            this.node1Service.getTaskJson().then((data: any) => {

                console.log(data);
                if (data.nodeData !== undefined) {
                    this.taskList = JSON.parse(JSON.stringify(data)).nodeData;

                    this.import(data);
                    this.node1Service.updateListWithNewTaskReload(data)
                }
            });


        }
        this.cdRef.detectChanges();
    }

    async uploadJson() {
        const fileHandler = await fileOpen({
            mimeTypes: ['application/json'],
            extensions: ['.json'],
            description: 'Upload DAG JSON',
            startIn: 'downloads',
            excludeAcceptAllOption: true,
        });
        this.import(await fileHandler.text());
        this.uploadedFileWithHandler = fileHandler;
        this.node1Service.setCurrentFileHandler(fileHandler.handle);
    }

    import(data: any) {
        let nodes: any = {};

        console.log(data);

        if (this.isValidJson(data)) {
            nodes = JSON.parse(data);
        } else {
            nodes = data;
        }
        this.node1Service.emptyAllNode();
        this.node1Service.reset();
        if (this.nodes.length) {
            this.nodes = [];
        }
        this.cdRef.detectChanges();

        nodes.nodeData.map((data: any) => {
            const n = {
                id: data.id,
                // name: data.name,
                type: data.type,
                cor: data.cor,
                // "formData": data.formData != undefined ? data.formData : {}
            };

            let formData: any = (nodes?.component as [])?.find((comp: any) => comp.id === data.id);
            if (formData == undefined) formData = {};

            console.log(n, formData);
            this.nodeChild.addDynamicNodes(n, formData);
            this.node1Service.maintainJason(n, formData);
            this.nodes.push(n);

            if (parseInt(data.id) > this.index) {
                this.index = parseInt(data.id);
            }
            this.cdRef.detectChanges();

        });

        if (nodes.connection.length > 0) {
            nodes.connection.forEach(connection => {
                this.node1Service.addConnection(connection);
            });
        }

        this.formComponentData = nodes;
        this.generateWorkflowForm();

        this.cdRef.detectChanges();
    }

    isValidJson(json) {
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
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

    generateWorkflowForm() {
        this.title = "Common Task";
        this.commonworkflowlist.forEach((da: any) => {
            if (da.type == 'boolean') {
                this.nodeForm.addControl(da.name, new FormControl(false, []));
            } else if (da.type == 'array') {
                this.nodeForm.addControl(da.name, new FormControl([], []));
            } else {
                this.nodeForm.addControl(da.name, new FormControl('', []));
            }

            if (da.required) {
                this.nodeForm.controls[da.name].addValidators(Validators.required);
            }
            if (da.readOnly) {
                this.nodeForm.controls[da.name].disable();
            }

            if (this.formComponentData && this.formComponentData[da.name] != undefined) {
                this.nodeForm.patchValue({
                    [da.name]: this.formComponentData[da.name]
                });
            }
        });
        this.save();
    }

    openModal() {
        this.show = true;
    }
    save() {
        this.node1Service.setCommonData(this.nodeForm.getRawValue());
        this.close1();
    }
    close1() {
        this.show = false;
    }
    resetValue() {
        this.nodeForm.reset();

    }
}