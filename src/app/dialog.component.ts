import { NodeService } from './node/node.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Component } from '@angular/core';




@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styles: [`
  ::ng-deep .modal {
       text-align: right !important;
    }

    .modal-dialog {
        min-width:none !important;
    }
  `]
})
export class DialogComponent  {
  title: string ="";
  questions:any = {name: '', type: ''};
  nodeForm = new FormGroup({

  });
  public formComponent = {
    "Input": [{
      "name": "component_name",
      "required": true,
      "value": "",
      "type": "text"
    },
    {
      "name": "component_type",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "sequence_number",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "input_data_file_path",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name":"input_schema_file_path",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "delimiter",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "header",
      "required": false,
      "value": false,
      "type": "boolean"
    },
    {
      "name": "input_data_file_type",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "id",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "table_name",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "database_name",
      "required": false,
      "value": "",
      "type": "text"
    }
    ],
    "Join":[ {
      "name": "sequence_number",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "component_type",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "join_type",
      "required": false,
      "value": "",
      "type": "text"
    },
     {
      "name": "join_condition",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "component_name",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "id",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "node_reference",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "broadcast_comp",
      "required": false,
      "value": "",
      "type": "text"
    }],
    "Filter": [{
      "name": "component_name",
      "required": true,
      "value": "",
      "type": "text"
    },
    {
      "name": "component_type",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "sequence_number",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "input_data_file_path",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name":"input_schema_file_path",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "delimiter",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "header",
      "required": false,
      "value": false,
      "type": "boolean"
    },
    {
      "name": "input_data_file_type",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "id",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "table_name",
      "required": false,
      "value": "",
      "type": "text"
    },
    {
      "name": "database_name",
      "required": false,
      "value": "",
      "type": "text"
    }
    ],
    "Sort":[],
    "InputRead":[],
    "WriteOutput": [],
    "Partition":[],
    "Lookup":[]

  }
  constructor() {

  }

  ngOnInit() {
    this.nodeForm.reset();
   this.questions.name = "Join";

   }


  apply() {
  //  this.result = this.questions;


  }

  create () {
 //   this.result = this.questions;

  }
}
