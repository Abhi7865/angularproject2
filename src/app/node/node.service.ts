import { HttpClient } from '@angular/common/http';
import {
    ComponentFactoryResolver,
    Injectable,
    ViewContainerRef
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserJsPlumbInstance, ContainmentType, newInstance } from '@jsplumb/browser-ui';
import { fileSave, FileSystemHandle } from 'browser-fs-access';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { DynamicNodeComponent } from './dynamicNode/dynamic-node.component';

class NodeTabDetails {
    nodes: any[] = [];
    nodeFormData: any[] = [];
    dynamicNodeCompList: DynamicNodeComponent[] = [];
    viewContainerRef: ViewContainerRef;
    jsPlumbInstance: BrowserJsPlumbInstance;
    fileHandle: FileSystemHandle;
}

@Injectable()
export class NodeService {

    nodeTabDetails: NodeTabDetails[] = [];
    selectedTabIndex = 0;

    public updateNodeList: BehaviorSubject<any> = new BehaviorSubject([]);
    public newTaskList: any[] = [];
    public tempnewTaskList: any = [];
    public tempWorkflowNode: any = [];
    public removeAllNode: Subject<any> = new Subject();
    public changeflowSub: Subject<any> = new Subject();

    fetchedComponentList$: Observable<any>;

    constructor(
        private factoryResolver: ComponentFactoryResolver,
        public http: HttpClient,
        private _snackBar: MatSnackBar) { }

    get selectedNodeTab() {
        return this.nodeTabDetails[this.selectedTabIndex];
    }
    setCurrentTabIndex(index: number) {
        this.selectedTabIndex = index;
    }

    public setRootViewContainerRef(viewContainerRef, hostVCR: ViewContainerRef) {

        this.nodeTabDetails.push(new NodeTabDetails());

        this.selectedNodeTab.viewContainerRef = viewContainerRef;

        this.selectedNodeTab.jsPlumbInstance = newInstance({
            container: hostVCR.element.nativeElement,
            dragOptions: {
                containment: ContainmentType.parentEnclosed,
            }
        });
    }

    public addDynamicNode(node: any, formData) {

        const factory = this.factoryResolver.resolveComponentFactory(DynamicNodeComponent);
        const component = factory.create(this.selectedNodeTab.viewContainerRef.parentInjector);

        component.instance.node = node;
        component.instance.formData = formData;
        component.instance.jsPlumbInstance = this.selectedNodeTab.jsPlumbInstance;

        this.selectedNodeTab.viewContainerRef.insert(component.hostView);
        this.selectedNodeTab.dynamicNodeCompList.push(component.instance);
    }

    public clear() {
        this.selectedNodeTab.viewContainerRef.clear();
    }

    getJSON(key): Observable<any> {

        const envPath = '../../assets/commonfiles/form.json';
        if (!this.fetchedComponentList$) {
            this.fetchedComponentList$ = this.http
                .get(envPath)
                .pipe(shareReplay(1));
        }
        return this.fetchedComponentList$;
    }

    maintainJson(n: any, formData) {
        this.selectedNodeTab.nodes.push(n);
        this.selectedNodeTab.nodeFormData.push(formData);
    }

    updateNodeFormData(id, formData) {
        const index = this.selectedNodeTab.nodes.findIndex((d: any) => d.id == id);
        this.selectedNodeTab.nodeFormData[index] = formData;
    }

    deleteNode(id: any) {
        const index = this.selectedNodeTab.nodes.findIndex((d: any) => d.id == id);
        this.selectedNodeTab.nodes.splice(index, 1);
        this.selectedNodeTab.nodeFormData.splice(index, 1);
        this.selectedNodeTab.dynamicNodeCompList.splice(index, 1);
    }

    async downloadJson(overwrite = false, filename: string) {

        if (!this.selectedNodeTab.nodes?.length) {
            this._snackBar.open("Graph doesn't contain any node", "", { panelClass: "snackbar-error" });
            return;
        }

        console.log(this.selectedNodeTab.nodes);

        const connections = (this.selectedNodeTab.jsPlumbInstance.getConnections() as any[])
            .map((conn) => ({ uuids: conn.getUuids() }));

        if (!connections?.length) {
            this._snackBar.open("Graph doesn't contain any edge", "", { panelClass: "snackbar-error" });
            return;
        }

        let invalidComp = this.selectedNodeTab.dynamicNodeCompList.find(comp => comp.nodeForm.invalid);
        if (invalidComp) {
            invalidComp.highlightNode();
            this._snackBar.open(`Form INVALID of Node - [${invalidComp.componentNameControl.value}]`, "", { panelClass: "snackbar-error" });
            return;
        }

        this.selectedNodeTab.dynamicNodeCompList.forEach((d, index) => {
            const da: any = this.selectedNodeTab.jsPlumbInstance.getEndpoints(d.getNodeElement())[0];
            this.selectedNodeTab.nodes[index].cor.x = da.element.offsetLeft;
            this.selectedNodeTab.nodes[index].cor.y = da.element.offsetTop;
        });

        let sequenceObj = this.getTaskSequence();
        if (sequenceObj == false) {
            return;
        }

        const allData = {
            "component": this.selectedNodeTab.nodeFormData,
            "nodeData": this.selectedNodeTab.nodes,
            "connection": connections
        }

        const nodeDataBlob = new Blob([JSON.stringify(allData)], {
            type: "application/json"
        });

        await this.saveFile(nodeDataBlob, overwrite, filename);
        this.updateListWithNewTask(allData, this.getCurrentFileHandler()?.name);

        return overwrite ? this.getCurrentFileHandler()?.name : undefined;

    }

    getTaskSequence() {

        // Get All Edges
        let edges = (this.selectedNodeTab.jsPlumbInstance.getConnections() as any[])
            .map(connection => ({
                sourceId: connection.sourceId,
                targetId: connection.targetId
            }));

        console.log("Edges: " + edges);
        if (!edges.length) {
            this._snackBar.open("Graph doesn't contain any edge", "", { panelClass: "snackbar-error" });
            return false;
        }


        // Create Node Map with indegree and target node array

        let nodeEdgeMap: { [uniqueId: string]: { indegree: number, target: string[] } } = {};
        let nodeExistRecord: { [uniqueId: string]: boolean } = {};

        for (let edge of edges) {
            if (!nodeExistRecord[edge.sourceId]) nodeEdgeMap[edge.sourceId] = { indegree: 0, target: [] };
            if (!nodeExistRecord[edge.targetId]) nodeEdgeMap[edge.targetId] = { indegree: 0, target: [] };

            nodeEdgeMap[edge.sourceId].target?.push(edge.targetId);
            nodeEdgeMap[edge.targetId].indegree = (nodeEdgeMap[edge.targetId].indegree || 0) + 1;

            if (!nodeExistRecord[edge.sourceId]) nodeExistRecord[edge.sourceId] = true;
            if (!nodeExistRecord[edge.targetId]) nodeExistRecord[edge.targetId] = true;
        }

        console.log("Node Edge Map: " + nodeEdgeMap);
        if (Object.keys(nodeEdgeMap).length != this.selectedNodeTab.nodes.length) {
            this._snackBar.open("Graph contains isolated node", "", { panelClass: "snackbar-error" });
            return false;
        }


        // Topological Sorting

        let topologicalOrderList = {};
        let noIncomeEdgeNodeList: string[] = [];

        // Fetch all node with 0 indegree (no incoming edges)
        for (let [key, value] of Object.entries(nodeEdgeMap)) {
            if (value.indegree === 0) noIncomeEdgeNodeList.push(key);
        }

        if (noIncomeEdgeNodeList.length === 0 && edges.length) {
            this._snackBar.open("Graph contains a cycle", "", { panelClass: "snackbar-error" });
            return false;
        }

        // Topological sort algo
        let index = 0;
        while (index < noIncomeEdgeNodeList.length) {
            topologicalOrderList[noIncomeEdgeNodeList[index]] = index + 1;

            nodeEdgeMap[noIncomeEdgeNodeList[index]].target?.forEach(target => {
                if (nodeEdgeMap[target].indegree > 0) nodeEdgeMap[target].indegree -= 1;
                if (nodeEdgeMap[target].indegree === 0) noIncomeEdgeNodeList.push(target);
            });
            index += 1;
        }
        console.log("Topological Order List: " + topologicalOrderList);

        if (Object.keys(topologicalOrderList).length !== Object.keys(nodeEdgeMap).length) {
            this._snackBar.open("Graph contains a cycle", "", { panelClass: "snackbar-error" });
            return false;
        }

        this.selectedNodeTab.nodes.forEach((node, index) => {
            node.sequenceNo = topologicalOrderList[node.uniqueId];
            this.selectedNodeTab.nodeFormData[index]["sequence_number"] = node.sequenceNo;
        });

        this.selectedNodeTab.nodes.sort((n1, n2) => n1.sequenceNo - n2.sequenceNo);
        this.selectedNodeTab.nodeFormData.sort((n1, n2) => n1.sequence_number - n2.sequence_number);
        console.log("Task Sorted: " + this.selectedNodeTab.nodes);

        return true;
    }

    async saveFile(blob, overwrite = false, filename: string) {

        const newHandle = await fileSave(blob, {
            id: "task",
            fileName: filename || 'TaskData',
            extensions: ['.json'],
            startIn: 'downloads',
            excludeAcceptAllOption: true,
        }, overwrite ? this.getCurrentFileHandler() : null);

        if (overwrite && this.getCurrentFileHandler()) {
            this._snackBar.open(`Changes saved in the existing file [${newHandle?.name}]`, "", { panelClass: "snackbar-success" });
        } else {
            this._snackBar.open(`File has been saved [${newHandle?.name}]`, "", { panelClass: "snackbar-success" });
        }

        overwrite && this.setCurrentFileHandler(newHandle);
    }

    setCurrentFileHandler(handler) {
        this.selectedNodeTab.fileHandle = handler;
    }
    getCurrentFileHandler() {
        return this.selectedNodeTab.fileHandle;
    }

    addConnection(connection) {
        this.selectedNodeTab.jsPlumbInstance.connect({ uuids: connection.uuids });
    }

    updateListWithNewTask(data: any, taskname: any) {
        data["taskname"] = taskname;
        let prevIndex = this.newTaskList.findIndex(task => task.taskname === taskname);
        if (prevIndex != -1) {
            this.newTaskList[prevIndex] = data;
        } else {
            this.newTaskList.push(data);
        }
        this.publishUpdatedNodeList();
    }

    publishUpdatedNodeList() {
        this.updateNodeList.next(this.newTaskList);
    }

    getTempWorkFlowJson() {

        return new Promise((resolve, reject) => {
            resolve(this.tempWorkflowNode);
        })
    }
    getTaskJson() {
        return new Promise((resolve, reject) => {
            resolve(this.tempnewTaskList);
        })
    }

    getNodeList() {
        return new Promise((resolve, reject) => {
            resolve(this.selectedNodeTab.nodes);
        })

    }

    removeAllNOde() {
        let connections = (this.selectedNodeTab.jsPlumbInstance.getConnections() as any[])
            .map((conn) => ({ uuids: conn.getUuids() }));

        this.selectedNodeTab.dynamicNodeCompList.forEach((d, index) => {
            const da: any = this.selectedNodeTab.jsPlumbInstance.getEndpoints(d.getNodeElement())[0];

            this.selectedNodeTab.nodes[index].cor.x = da.element.offsetLeft;
            this.selectedNodeTab.nodes[index].cor.y = da.element.offsetTop;
        });

        const allData = {
            "nodeData": this.selectedNodeTab.nodes,
            "connection": connections
        }
        this.tempWorkflowNode = JSON.parse(JSON.stringify(allData));
        this.removeAllNode.next();
        this.emptyAllNode();

    }
    removeAllTaskList() {
        let connections = (this.selectedNodeTab.jsPlumbInstance.getConnections() as any[])
            .map((conn) => ({ uuids: conn.getUuids() }));

        this.selectedNodeTab.dynamicNodeCompList.forEach((d, index) => {
            const da: any = this.selectedNodeTab.jsPlumbInstance.getEndpoints(d.getNodeElement())[0];

            this.selectedNodeTab.nodes[index].cor.x = da.element.offsetLeft;
            this.selectedNodeTab.nodes[index].cor.y = da.element.offsetTop;

        });

        const allData = {
            "nodeData": this.selectedNodeTab.nodes,
            "connection": connections
        }
        this.tempnewTaskList = JSON.parse(JSON.stringify(allData));

        this.removeAllNode.next();
        this.emptyAllNode();
    }

    emptyAllNode() {
        this.selectedNodeTab.nodes = [];
        this.selectedNodeTab.nodeFormData = [];

        this.selectedNodeTab.dynamicNodeCompList = [];
    }

    reset() {
        this.selectedNodeTab.jsPlumbInstance.reset();
    }

    deleteNodeTab() {
        let nodeDetails = this.nodeTabDetails[this.selectedTabIndex];
        if (nodeDetails.fileHandle) {
            let index = this.newTaskList.findIndex(task => task.taskname === nodeDetails.fileHandle.name);
            if (index > -1) {
                this.newTaskList.splice(index, 1);
                this.publishUpdatedNodeList();
            }
        }
        this.nodeTabDetails.splice(this.selectedTabIndex, 1);
    }

    updateListWithNewTaskReload(newdata: any) {
        let newTask: any = [];
        newdata.nodeData.map((d: any) => {
            let setProperty = {};
            setProperty["taskname"] = d.type;
            setProperty["type"] = 'task';
            newTask.push(setProperty);
            console.log(this.newTaskList);

        })

        this.tempnewTaskList = JSON.parse(JSON.stringify(newTask));
        this.updateNodeList.next(this.newTaskList);
    }
    changeflow(type: any) {
        this.changeflowSub.next(type)
    }
}

