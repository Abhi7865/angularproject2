import { AfterViewInit, Component, Input, OnChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { Node1Service } from './node1.service';

@Component({
    selector: 'app-node1',
    templateUrl: './node1.component.html',
    styleUrls: ['./node1.component.scss']
})
export class Node1Component implements OnChanges, AfterViewInit {

    @Input() nodes;

    @ViewChild('nodes', { read: ViewContainerRef, static: true }) viewContainerRef: ViewContainerRef | undefined;
    @ViewChild('nodeContainer', { read: ViewContainerRef, static: true }) hostVCR: ViewContainerRef;

    constructor(private nodeService: Node1Service) {
    }

    ngAfterViewInit() {
        //     this.nodeService.jsPlumbInstance.bind('connection', info => {

        //      this.nodeService.updateSourceInformation(info);
        //      this.nodeService.updateTargetInformation(info);

        //    });
    }

    ngOnChanges() {
        this.nodeService.setRootViewContainerRef(this.viewContainerRef, this.hostVCR);
        this.nodeService.clear();
    }

    addDynamicNodes(node, formData) {
        this.nodeService.addDynamicNode(node, formData);
    }
}
