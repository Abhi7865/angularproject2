import { Component, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DagComponent } from './dag/dag.component';
import { NodeService } from './node/node.service';
import { Node1Service } from './node1/node1.service';
import { TaskComponent } from './task/task.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    selectedIndex = 0;
    @ViewChild(TaskComponent) TaskComponent: TaskComponent;
    @ViewChild(DagComponent) DagComponent: DagComponent;

    constructor(
        private nodeService: NodeService,
        private node1Service: Node1Service,
        private _snackBar: MatSnackBar) { }

    ngOnInit() { }

    saveJson(overwrite = false) {
        if (this.isDagView) {
            if (this.DagComponent.nodeForm.valid) {
                this.node1Service.downloadJson(overwrite);
            } else {
                this._snackBar.open("Form INVALID of [Workflow Settings]", "", { panelClass: "snackbar-error" });
            }
        } else {
            this.nodeService.downloadJson(overwrite, this.TaskComponent.getCurrentCanvasTab().title).then(filename => {
                console.log(filename);
                this.TaskComponent.setCurrentTabLabel(filename);
            });
        }
    }

    importJson() {
        if (this.isDagView) {
            this.DagComponent.uploadJson();
        } else {
            this.TaskComponent.uploadJson();
        }
    }

    get isDagView() {
        return this.selectedIndex === 1;
    }

    isValidJson(json) {
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    }

    changeflowapp(val: any) {
        this.nodeService.changeflow(val);
    }
}
