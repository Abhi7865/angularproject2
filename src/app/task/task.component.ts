import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { fileOpen, FileWithHandle } from 'browser-fs-access';
import { concat, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, skip, take } from 'rxjs/operators';
import { NodeComponent } from '../node/node.component';
import { NodeService } from '../node/node.service';

@Component({
    selector: 'app-task',
    templateUrl: './task.component.html',
    styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {

    nodes: any[] = [];
    @ViewChild('nodeChild') nodeChild: NodeComponent;

    index = 0;
    popupTittle = "";

    taskList: any[] = [];
    typeofFlow = 'workflow';

    public componentlist: string[] = [];
    filteredComponentList$: Observable<string[]>;
    searchControl = new FormControl();

    uploadedFileWithHandler: FileWithHandle;

    constructor(private cdRef: ChangeDetectorRef, private nodeService: NodeService) { }

    ngOnInit() {

        this.filteredComponentList$ = concat(
            this.searchControl.valueChanges.pipe(take(1)),
            this.searchControl.valueChanges.pipe(
                skip(1),
                debounceTime(250),
                distinctUntilChanged()
            )
        ).pipe(
            map(input => input ? this.filterComponentList(input) : this.componentlist)
        );

        // this.nodeService.updateNodeList.subscribe((information) => {
        //     this.taskList = information;
        //     console.log(this.taskList);
        // });

        this.nodeService.changeflowSub.subscribe((data) => {
            this.changeFlow(data);
        });

    }

    ngAfterViewInit() {
        this.nodeService.getJSON('').subscribe((data) => {
            this.componentlist = Object.keys(data);
            this.searchControl.setValue("");
            this.cdRef.detectChanges();
        });
    }

    filterComponentList(input: string) {
        input = input.trim();
        if (input) {
            input = input.toLowerCase();
            return this.componentlist.filter(component => component.toLowerCase().includes(input));
        }
        return [];
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
        this.nodeService.maintainJason(n, {});
        this.nodes.push(n);

    }

    onItemDrop(event: any) {
        this.popupTittle = event.data;
        const screen = { "x": event.event.offsetX - 75, 'y': event.event.offsetY - 25 };
        this.create(screen);
    }

    changeFlow(val: any) {

        this.typeofFlow = val.value;
        if (val.value == 'workflow') {
            this.taskList = [];
            this.nodeService.removeAllTaskList();
            this.nodeService.getTempWorkFlowJson().then((data) => {

                this.import(data);
            });

        } else {

            this.nodeService.removeAllNOde();
            this.nodeService.getTaskJson().then((data: any) => {
                if (data.nodeData !== undefined) {
                    this.taskList = JSON.parse(JSON.stringify(data)).nodeData;

                    this.import(data);
                    this.nodeService.updateListWithNewTaskReload(data)
                }
            });


        }
        this.cdRef.detectChanges();
    }

    async uploadJson() {
        const fileHandler = await fileOpen({
            mimeTypes: ['application/json'],
            extensions: ['.json'],
            description: 'Upload Task JSON',
            startIn: 'downloads',
            excludeAcceptAllOption: true,
        });
        this.import(await fileHandler.text());
        this.uploadedFileWithHandler = fileHandler;
        this.nodeService.setCurrentFileHandler(fileHandler.handle);
    }

    import(data: any) {

        let nodes: any = [];

        console.log(data);

        if (this.isValidJson(data)) {
            nodes = JSON.parse(data);
        } else {
            nodes = data;
        }

        this.nodeService.emptyAllNode();
        this.nodeService.reset();
        if (this.nodes.length) {
            this.nodes = [];
        }
        this.cdRef.detectChanges();

        nodes.nodeData.map((data: any, index) => {
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
            this.nodeService.maintainJason(n, formData);
            this.nodes.push(n);

            if (parseInt(data.id) > this.index) {
                this.index = parseInt(data.id);
            }
            this.cdRef.detectChanges();

        });

        if (nodes.connection.length > 0) {
            nodes.connection.forEach(connection => {
                this.nodeService.addConnection(connection);
            });
        }

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
}
