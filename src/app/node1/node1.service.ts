import { HttpClient } from '@angular/common/http';
import { ComponentFactoryResolver, Injectable, ViewContainerRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { fileSave, FileSystemHandle } from 'browser-fs-access';
import { jsPlumb, jsPlumbInstance } from 'jsplumb';
import { Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Dynamicnode1Component } from './dynamicnode1/dynamicnode1.component';
@Injectable()
export class Node1Service {
    nodes: any[] = [];
    nodeFormData: any[] = [];
    jsPlumbInstance: jsPlumbInstance;

    private rootViewContainer: ViewContainerRef;
    public commonData: any = [];
    public updateNodeList: Subject<any> = new Subject();
    public newTaskList: any[] = [];
    public tempnewTaskList: any = [];
    public tempWorkflowNode: any = [];
    public removeAllNode: Subject<any> = new Subject();
    public changeflowSub: Subject<any> = new Subject();

    fetchedCommonData$: Observable<any>;
    fetchedComponentList$: Observable<any>;
    currentFileHandler: FileSystemHandle | null;

    constructor(
        private factoryResolver: ComponentFactoryResolver,
        public http: HttpClient,
        private _snackBar: MatSnackBar) {
    }
    public setRootViewContainerRef(viewContainerRef, hostVCR: ViewContainerRef) {
        this.rootViewContainer = viewContainerRef;

        this.jsPlumbInstance = jsPlumb.getInstance({
            Container: hostVCR.element.nativeElement,
            DragOptions: {
                containment: "parentEnclosed"
            }
        });
    }

    public addDynamicNode(node: any, formData) {
        const factory = this.factoryResolver.resolveComponentFactory(Dynamicnode1Component);
        const component = factory.create(this.rootViewContainer.parentInjector);
        (<any>component.instance).node = node;
        (<any>component.instance).formData = formData;
        (<any>component.instance).jsPlumbInstance = this.jsPlumbInstance;
        this.rootViewContainer.insert(component.hostView);
    }

    public clear() {
        this.rootViewContainer.clear();
    }

    getJSON(key): Observable<any> {

        const envPath = '../../assets/commonfiles/workflow.json';
        if (!this.fetchedComponentList$) {
            this.fetchedComponentList$ = this.http
                .get(envPath)
                .pipe(shareReplay(1));
        }
        return this.fetchedComponentList$;
    }

    getcommonJSON(key): Observable<any> {
        const envPath1 = '../../assets/commonfiles/commonworkflow.json';
        if (!this.fetchedCommonData$) {
            this.fetchedCommonData$ = this.http
                .get(envPath1)
                .pipe(shareReplay(1));
        }
        return this.fetchedCommonData$;
    }
    maintainJason(n: any, formData) {
        this.nodes.push(n);
        this.nodeFormData.push(formData);
    }
    updateNodeFormData(id, formData) {
        const index = this.nodes.findIndex((d: any) => d.id == id);
        this.nodeFormData[index] = formData;

    }
    setCommonData(data) {
        this.commonData = data;
    }

    deleteNode(id: any) {
        const index = this.nodes.findIndex((d: any) => d.id == id);
        this.nodes.splice(index, 1);
        this.nodeFormData.splice(index, 1);
    }

    downloadJson(overwrite = false) {

        if (!this.nodes?.length) {
            this._snackBar.open("Graph doesn't contain any node", "", { panelClass: "snackbar-error" });
            return;
        }

        console.log(JSON.stringify(this.nodes));

        const connections = (this.jsPlumbInstance.getAllConnections() as any[])
            .map((conn) => ({ uuids: conn.getUuids() }));

        if (!connections?.length) {
            this._snackBar.open("Graph doesn't contain any edge", "", { panelClass: "snackbar-error" });
            return;
        }

        let counter = 0;
        this.nodes.map((d: any) => {
            const da: any = this.jsPlumbInstance.getEndpoints(d.id)[0];

            this.nodes[counter].cor.x = da.element.offsetLeft;
            this.nodes[counter].cor.y = da.element.offsetTop;

            counter++;
        });

        let sequenceObj = this.getTaskSequence();
        if (sequenceObj == false) {
            return;
        }

        const allData = {
            "component": this.nodeFormData,
            "nodeData": this.nodes,
            "connection": connections
        }

        const nodeDataBlob = new Blob([JSON.stringify({ ...allData, ...this.commonData })], {
            type: "application/json"
        });

        this.saveFile(nodeDataBlob, overwrite).then(() => {
            this.getCurrentFileHandler()?.name &&
                this.updateListWithNewTask(allData, this.getCurrentFileHandler()?.name);
        });

    }

    getTaskSequence() {

        // Get All Edges
        let edges = this.jsPlumbInstance.getAllConnections()
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

        let nodeEdgeMap: { [id: string]: { indegree: number, target: string[] } } = {};
        let nodeExistRecord: { [id: string]: boolean } = {};

        for (let edge of edges) {
            if (!nodeExistRecord[edge.sourceId]) nodeEdgeMap[edge.sourceId] = { indegree: 0, target: [] };
            if (!nodeExistRecord[edge.targetId]) nodeEdgeMap[edge.targetId] = { indegree: 0, target: [] };

            nodeEdgeMap[edge.sourceId].target?.push(edge.targetId);
            nodeEdgeMap[edge.targetId].indegree = (nodeEdgeMap[edge.targetId].indegree || 0) + 1;

            if (!nodeExistRecord[edge.sourceId]) nodeExistRecord[edge.sourceId] = true;
            if (!nodeExistRecord[edge.targetId]) nodeExistRecord[edge.targetId] = true;
        }

        console.log("Node Edge Map: " + nodeEdgeMap);
        if (Object.keys(nodeEdgeMap).length != this.nodes.length) {
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

        this.nodes.forEach((node, index) => {
            node.sequenceNo = topologicalOrderList[node.id];
            this.nodeFormData[index]["sequence_number"] = node.sequenceNo;
        });

        this.nodes.sort((n1, n2) => n1.sequenceNo - n2.sequenceNo);
        this.nodeFormData.sort((n1, n2) => n1.sequence_number - n2.sequence_number);
        console.log("Task Sorted: " + this.nodes);

        return true;
    }

    async saveFile(blob, overwrite = false) {

        const newHandle = await fileSave(blob, {
            id: "dag",
            fileName: 'DAG',
            extensions: ['.json'],
            startIn: 'downloads',
            excludeAcceptAllOption: true,
        }, overwrite ? this.getCurrentFileHandler() : null);

        if (overwrite && this.getCurrentFileHandler()) {
            this._snackBar.open(`Changes saved in the existing file [${newHandle?.name}]`, "", { panelClass: "snackbar-success" });
        } else {
            this._snackBar.open(`File has been saved [${newHandle?.name}]`, "", { panelClass: "snackbar-success" });
        }

        this.setCurrentFileHandler(newHandle);
    }

    setCurrentFileHandler(handler) {
        this.currentFileHandler = handler;
    }
    getCurrentFileHandler() {
        return this.currentFileHandler;
    }

    connectNodes() {

        const allSourceArray = JSON.parse(JSON.stringify(this.nodes));
        const allTargetArray = JSON.parse(JSON.stringify(this.nodes));


        allSourceArray.map((data: any) => {

            if (data.type == 'Join') {

                const targetData = allTargetArray.filter((tar: any) => tar.id == data.TargetLeft);
                var endpoint1 = this.jsPlumbInstance.getEndpoints(targetData[0].id)[0];
                var endpoint2 = this.jsPlumbInstance.getEndpoints(data.id)[0];
                this.jsPlumbInstance.connect({ source: endpoint1, target: endpoint2 });
                // Target top
                const targetDataRight = allTargetArray.filter((tar: any) => tar.id == data.TargetTop);
                var endpoint3 = this.jsPlumbInstance.getEndpoints(targetDataRight[0].id)[0];
                var endpoint2 = this.jsPlumbInstance.getEndpoints(data.id)[1];
                this.jsPlumbInstance.connect({ source: endpoint3, target: endpoint2 });
            } else {
                const targetData = allTargetArray.filter((tar: any) => tar.id == data.target);
                var endpoint5 = this.jsPlumbInstance.getEndpoints(targetData[0].id)[1];
                var endpoint6 = this.jsPlumbInstance.getEndpoints(data.id)[0];

                this.jsPlumbInstance.connect({ source: endpoint6, target: endpoint5 });
            }
        });
    }

    checkDescription() {

    }

    addConnection(connection) {
        this.jsPlumbInstance.connect({ uuids: connection.uuids });
    }

    updateListWithNewTask(data: any, taskname: any) {
        data["taskname"] = taskname;
        let prevIndex = this.newTaskList.findIndex(task => task.taskname === taskname);
        if (prevIndex != -1) {
            this.newTaskList[prevIndex] = data;
        } else {
            this.newTaskList.push(data);
        }
        this.newTaskList.push(data);
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
            resolve(this.nodes);
        })

    }

    removeAllNOde() {
        let connections = (this.jsPlumbInstance.getAllConnections() as any[])
            .map((conn) => ({ uuids: conn.getUuids() }));
        let counter = 0;
        this.nodes.map((d: any) => {
            const da: any = this.jsPlumbInstance.getEndpoints(d.id)[0];

            this.nodes[counter].cor.x = da.element.offsetLeft;
            this.nodes[counter].cor.y = da.element.offsetTop;

            counter++;
        })

        const allData = {
            "nodeData": this.nodes,
            "connection": connections
        }
        this.tempWorkflowNode = JSON.parse(JSON.stringify(allData));
        this.removeAllNode.next();
        this.emptyAllNode();

    }
    removeAllTaskList() {
        let connections = (this.jsPlumbInstance.getAllConnections() as any[])
            .map((conn) => ({ uuids: conn.getUuids() }));
        let counter = 0;
        console.log(this.nodes);
        this.nodes.map((d: any) => {
            const da: any = this.jsPlumbInstance.getEndpoints(d.id)[0];

            this.nodes[counter].cor.x = da.element.offsetLeft;
            this.nodes[counter].cor.y = da.element.offsetTop;

            counter++;
        })

        const allData = {
            "nodeData": this.nodes,
            "connection": connections
        }
        this.tempnewTaskList = JSON.parse(JSON.stringify(allData));

        this.removeAllNode.next();
        this.emptyAllNode();
    }

    emptyAllNode() {
        this.nodes = [];
        this.nodeFormData = [];
    }

    reset() {
        this.jsPlumbInstance.reset();
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

