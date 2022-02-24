import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DagService {
private url="http://localhost:8081/dragDropApi/saveWorkflowPython";
  constructor(private http:HttpClient) { }
 

  saveWorkflowPython(data: JSON) {
    return this.http.post(this.url,data );
  }
}
