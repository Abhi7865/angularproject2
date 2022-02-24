import { AfterViewInit, Component, Input, OnChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { NodeService } from './node.service';


@Component({
    selector: 'app-node',
    templateUrl: './node.component.html',
    styleUrls: ['./node.component.scss']
})
export class NodeComponent implements AfterViewInit {

    @Input() nodes;

    @ViewChild('nodes', { read: ViewContainerRef, static: true }) viewContainerRef: ViewContainerRef | undefined;
    @ViewChild('nodeContainer', { read: ViewContainerRef, static: true }) hostVCR: ViewContainerRef;

    constructor(private nodeService: NodeService) {
    }

    ngAfterViewInit() {
        this.setViewContainerRef();
    }

    clearContainer() {
        this.nodeService.clear();
    }

    setViewContainerRef() {
        this.nodeService.setRootViewContainerRef(this.viewContainerRef, this.hostVCR);
    }

    addDynamicNodes(node, formData) {
        this.nodeService.addDynamicNode(node, formData);
    }
}
