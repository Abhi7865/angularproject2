import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MatTooltipModule, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { AutosizeModule } from 'ngx-autosize';
import { DndModule } from 'ngx-drag-drop';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DagComponent } from './dag/dag.component';
import { DialogComponent } from './dialog.component';
import { DynamicNodeComponent } from './node/dynamicNode/dynamic-node.component';
import { NodeComponent } from './node/node.component';
import { NodeService } from './node/node.service';
import { Dynamicnode1Component } from './node1/dynamicnode1/dynamicnode1.component';
import { Node1Component } from './node1/node1.component';
import { Node1Service } from './node1/node1.service';
import { TaskComponent } from './task/task.component';



const routes: Routes = [
    { path: 'dag', component: DagComponent },
    { path: '', component: TaskComponent },

];

declare global {
    interface FileSystemFileHandle { }
    interface FileSystemDirectoryHandle { }
    interface FileSystemDirectoryEntry { }
}

export const CUSTOM_DATE_FORMAT = {
    parse: {
        dateInput: ['DD-MM-YYYY']
    },
    display: {
        dateInput: 'DD-MM-YYYY',
        monthYearLabel: 'YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'YYYY',
    },
}

@NgModule({
    declarations: [
        AppComponent,
        NodeComponent,
        DynamicNodeComponent,
        DialogComponent,
        Node1Component,
        Dynamicnode1Component,
        DagComponent,
        TaskComponent
    ],
    entryComponents: [DynamicNodeComponent, DialogComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        NgSelectModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        DndModule,
        RouterModule.forRoot(routes),
        HttpClientModule,
        BrowserAnimationsModule,
        MatInputModule,
        MatCheckboxModule,
        MatChipsModule,
        MatIconModule,
        MatButtonModule,
        MatListModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        AutosizeModule
    ],
    exports: [RouterModule],
    providers: [
        NodeService,
        Node1Service,
        {
            provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {
                duration: 3000,
                // horizontalPosition: "center",
                // verticalPosition: "bottom"
            }
        },
        {
            provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: {
                showDelay: 400
            }
        },
        {
            provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMAT
        },
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
