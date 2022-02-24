import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { fileOpen, FileWithHandle } from 'browser-fs-access';
import { concat, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, skip, take } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { NodeComponent } from '../node/node.component';
import { NodeService } from '../node/node.service';


class CanvasTab {
    id: number;
    _title: string;
    title: string;
    editing = false;
    nodes: any[] = [];

    constructor(index: number) {
        this.id = index;
        this.title = "Canvas-" + index;
    }
}

@Component({
    selector: 'app-task',
    templateUrl: './task.component.html',
    styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {

    selectedTabIndex = 0;
    canvasTabIndex = 1;
    canvasTabDetails = [new CanvasTab(this.canvasTabIndex)];

    popupTittle = "";

    taskList: any[] = [];
    typeofFlow = 'workflow';

    public componentlist: string[] = [];
    filteredComponentList$: Observable<string[]>;
    searchControl = new FormControl();

    uploadedFileWithHandler: FileWithHandle;

    @ViewChildren('nodeChild') nodeComponentList: QueryList<NodeComponent>;

    constructor(
        private cdRef: ChangeDetectorRef,
        private nodeService: NodeService,
        private _snackBar: MatSnackBar) { }

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

        // this.nodeService.changeflowSub.subscribe((data) => {
        //     this.changeFlow(data);
        // });

    }

    ngAfterViewInit() {
        this.nodeService.getJSON('').subscribe((data) => {
            this.componentlist = Object.keys(data);
            this.searchControl.setValue("");
            this.cdRef.detectChanges();
        });
    }

    get currentCanvasTab() {
        return this.canvasTabDetails[this.selectedTabIndex];
    }

    getCurrentCanvasTab() {
        return this.currentCanvasTab;
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
            id: uuidv4().replaceAll('-', ''),
            // name: this.popupTittle,
            type: this.popupTittle,
            cor: cor,
        };

        this.nodeComponentList.get(this.selectedTabIndex)?.addDynamicNodes(n, {});
        this.nodeService.maintainJson(n, {});
        this.currentCanvasTab?.nodes.push(n);

    }

    onItemDrop(event: any) {
        this.popupTittle = event.data;
        const screen = { "x": event.event.offsetX - 75, 'y': event.event.offsetY - 25 };
        this.create(screen);
    }

    // changeFlow(val: any) {

    //     this.typeofFlow = val.value;
    //     if (val.value == 'workflow') {
    //         this.taskList = [];
    //         this.nodeService.removeAllTaskList();
    //         this.nodeService.getTempWorkFlowJson().then((data) => {

    //             this.import(data);
    //         });

    //     } else {

    //         this.nodeService.removeAllNOde();
    //         this.nodeService.getTaskJson().then((data: any) => {
    //             if (data.nodeData !== undefined) {
    //                 this.taskList = JSON.parse(JSON.stringify(data)).nodeData;

    //                 this.import(data);
    //                 this.nodeService.updateListWithNewTaskReload(data)
    //             }
    //         });


    //     }
    //     this.cdRef.detectChanges();
    // }

    async uploadJson() {
        const fileHandler = await fileOpen({
            mimeTypes: ['application/json'],
            extensions: ['.json'],
            description: 'Upload Task JSON',
            startIn: 'downloads',
            excludeAcceptAllOption: true,
        });
        this.uploadedFileWithHandler = fileHandler;

        let fileAlreadyExistsIndex = this.nodeService.nodeTabDetails
            .findIndex(tab => tab.fileHandle && (fileHandler.name === tab.fileHandle.name));

        if (fileAlreadyExistsIndex > -1) {
            this._snackBar.open("File already imported in Canvas " + (fileAlreadyExistsIndex + 1), "", { panelClass: "snackbar-warning" });
            return;
        }

        this.import(await fileHandler.text());
        this.nodeService.setCurrentFileHandler(fileHandler.handle);

        this.currentCanvasTab.title = this.uploadedFileWithHandler.name.replace(".json", "");
    }

    import(data: any) {

        let nodes: any = {};

        if (this.isValidJson(data)) {
            nodes = JSON.parse(data);
        } else {
            nodes = data;
        }

        if (!nodes?.nodeData?.length) {
            this._snackBar.open("JSON doesn't contain node data (field: 'nodeData')", "", { panelClass: "snackbar-error" });
            return;
        }
        if (!nodes?.connection?.length) {
            this._snackBar.open("JSON doesn't contain node connection data (field: 'connection')", "", { panelClass: "snackbar-error" });
            return;
        }

        this.addNewCanvas();

        // this.nodeComponentList.get(this.selectedTabIndex)?.clearContainer();
        // this.nodeService.emptyAllNode();
        // this.nodeService.reset();

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
            this.nodeComponentList.get(this.selectedTabIndex)?.addDynamicNodes(n, formData);
            this.nodeService.maintainJson(n, formData);
            this.currentCanvasTab?.nodes.push(n);

            this.cdRef.detectChanges();

        });

        if (nodes.connection.length > 0) {
            nodes.connection.forEach(connection => {
                this.nodeService.addConnection(connection);
            });
        }
        
        this.nodeService.updateListWithNewTask(nodes, this.uploadedFileWithHandler?.name);
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

    nodeTabChanged(e) {
        this.nodeService.setCurrentTabIndex(e.index);
    }

    addNewCanvas() {
        this.canvasTabDetails.push(new CanvasTab(++this.canvasTabIndex));
        this.selectedTabIndex = this.canvasTabDetails.length - 1;
        this.nodeService.setCurrentTabIndex(this.selectedTabIndex);
    }

    resetCanvas() {
        this.nodeComponentList.get(this.selectedTabIndex)?.clearContainer();
        this.currentCanvasTab.nodes = [];
        this.nodeService.emptyAllNode();
        this.nodeService.reset();
    }

    deleteCanvas() {
        this.resetCanvas();
        this.nodeService.deleteNodeTab();
        this.canvasTabDetails.splice(this.selectedTabIndex, 1);

        this.selectedTabIndex -= 1;
        this.nodeService.setCurrentTabIndex(this.selectedTabIndex);
    }

    setCurrentTabLabel(newLabel: string | undefined) {
        if (newLabel) {
            newLabel = newLabel.replace(".json", "");
            this.currentCanvasTab.title = newLabel;
        }
    }

    tabLabelEdit(tab: CanvasTab = this.canvasTabDetails[this.selectedTabIndex]) {
        tab._title = tab.title;
        tab.editing = true;
    }

    tabLabelRename(e, tab: CanvasTab, forceStop = false) {
        if (tab._title) {
            tab._title = tab._title.trim();
        }
        if (tab._title) {
            let sameLabelTabExist = this.canvasTabDetails.find(t => t.title === tab._title && t.id !== tab.id);
            if (sameLabelTabExist) {
                this._snackBar.open("Canvas Label already exists", "", { panelClass: "snackbar-error" });
                tab._title = tab.title;
                if (forceStop) tab.editing = false;
            } else {
                tab.title = tab._title;
                tab.editing = false;
            }
        } else {
            tab._title = tab.title;
            if (forceStop) tab.editing = false;
        }
    }
}
