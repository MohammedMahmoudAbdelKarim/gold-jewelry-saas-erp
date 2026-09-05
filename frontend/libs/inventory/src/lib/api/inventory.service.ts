import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JewelryItem, InventoryStatus } from '../models/inventory.models';

@Injectable({
  providedIn: 'root'
})
export class InventoryApiService {
  private http = inject(HttpClient);
  private apiUrl = '/api/inventory'; // Base URL intercepted by environment

  getItems(branchId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/items/branch/${branchId}`);
  }

  getItemByBarcode(barcode: string, goldRate: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/items/barcode/${barcode}?goldRate=${goldRate}`);
  }

  createItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/items`, item);
  }

  updateItemStatus(id: string, status: InventoryStatus): Observable<JewelryItem> {
    return this.http.patch<JewelryItem>(`${this.apiUrl}/items/${id}/status`, { status });
  }

  updateItem(id: string, item: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/items/${id}`, item);
  }

  deleteItem(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/items/${id}`);
  }
}
