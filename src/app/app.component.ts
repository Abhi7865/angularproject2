import { Component, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
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

    @ViewChild(RouterOutlet) routerOutlet: RouterOutlet;

    constructor(
        private nodeService: NodeService,
        private node1Service: Node1Service,
        private router: Router) { }

    ngOnInit() { }

    saveJson(overwrite = false) {
        if (this.isDagView) {
            this.node1Service.downloadJson(overwrite);
        } else {
            this.nodeService.downloadJson(overwrite);
        }
    }

    importJson() {
        if (this.isDagView) {
            (this.routerOutlet.component as DagComponent).uploadJson();
        } else {
            (this.routerOutlet.component as TaskComponent).uploadJson();
        }
    }

    get isDagView() {
        return this.router.url.includes("dag");
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
