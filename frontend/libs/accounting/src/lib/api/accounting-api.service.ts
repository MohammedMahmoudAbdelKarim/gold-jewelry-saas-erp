import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountingOverview, LedgerEntry } from '../models/accounting.models';

@Injectable({
  providedIn: 'root',
})
export class AccountingApiService {
  private http = inject(HttpClient);
  private apiUrl = '/api/accounting';

  getOverview(): Observable<AccountingOverview> {
    return this.http.get<AccountingOverview>(`${this.apiUrl}/overview`);
  }

  getLedger(): Observable<LedgerEntry[]> {
    return this.http.get<LedgerEntry[]>(`${this.apiUrl}/ledger`);
  }
}
