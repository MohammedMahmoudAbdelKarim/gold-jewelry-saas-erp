import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportsSummary, RecentSale } from '../models/reports.models';

@Injectable({
  providedIn: 'root',
})
export class ReportsApiService {
  private http = inject(HttpClient);
  private apiUrl = '/api/reports';

  getSummary(): Observable<ReportsSummary> {
    return this.http.get<ReportsSummary>(`${this.apiUrl}/summary`);
  }

  getRecentSales(limit = 10): Observable<RecentSale[]> {
    return this.http.get<RecentSale[]>(`${this.apiUrl}/recent-sales`, { params: { limit } });
  }
}
