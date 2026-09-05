import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../models/suppliers.models';

@Injectable({
  providedIn: 'root',
})
export class SuppliersApiService {
  private http = inject(HttpClient);
  private apiUrl = '/api/suppliers';

  getAll(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.apiUrl);
  }

  getById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateSupplierDto): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateSupplierDto): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
