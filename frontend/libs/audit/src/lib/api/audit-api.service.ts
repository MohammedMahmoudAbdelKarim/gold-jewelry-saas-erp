import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLogEntry } from '../models/audit.models';

@Injectable({
  providedIn: 'root',
})
export class AuditApiService {
  private http = inject(HttpClient);
  private apiUrl = '/api/audit';

  getAll(): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(this.apiUrl);
  }
}
