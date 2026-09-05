import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { JewelryItem } from '../models/inventory.models';
import { InventoryApiService } from '../api/inventory.service';
import { ValuationService } from '../services/valuation.service';

interface InventoryState {
  items: JewelryItem[];
  isLoading: boolean;
  error: string | null;
  filters: {
    branchId?: string;
  };
}

const initialState: InventoryState = {
  items: [],
  isLoading: false,
  error: null,
  filters: {}
};

export const InventoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state, valuationService = inject(ValuationService)) => ({
    totalItems: computed(() => state.items().length),
    totalInventoryValue: computed(() => 
      state.items().reduce((total, item) => 
        total + valuationService.calculateTotalItemValue(item.goldDetails, item.diamondDetails), 0
      )
    ),
    totalGoldWeight: computed(() => 
      state.items().reduce((total, item) => total + (item.goldDetails?.weightGrams || 0), 0)
    )
  })),
  withMethods((state, apiService = inject(InventoryApiService)) => ({
    updateFilters: (filters: Partial<InventoryState['filters']>) => {
      patchState(state, { filters: { ...state.filters(), ...filters } });
    },
    
    loadItems: rxMethod<void>(
      pipe(
        tap(() => patchState(state, { isLoading: true, error: null })),
        switchMap(() => {
          return apiService.getItems(state.filters()).pipe(
            tapResponse({
              next: (items) => patchState(state, { items, isLoading: false }),
              error: (err: any) => patchState(state, { error: err.message, isLoading: false })
            })
          );
        })
      )
    )
  }))
);
