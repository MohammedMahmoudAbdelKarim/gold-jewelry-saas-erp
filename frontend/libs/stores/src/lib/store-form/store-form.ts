import { Component, ChangeDetectionStrategy, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { PageLoaderComponent } from '@frontend/ui';
import type * as Leaflet from 'leaflet';

@Component({
  selector: 'lib-store-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageLoaderComponent, TranslatePipe],
  templateUrl: './store-form.html',
  styleUrl: './store-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreForm implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected languageService = inject(LanguageService);
  private translate = inject(TranslateService);

  storeId: string | null = null;
  isEditMode = false;

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form Signals
  formName = signal<string>('');
  formType = signal<string>('retail');
  formLocation = signal<string>('');
  formIsActive = signal<boolean>(true);

  // Map elements
  private leaflet: typeof Leaflet | null = null;
  map: Leaflet.Map | undefined;
  marker: Leaflet.Marker | undefined;

  ngOnInit() {
    this.storeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.storeId;
    this.loadStoreDetails();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 150);
  }

  loadStoreDetails() {
    if (!this.isEditMode || !this.storeId) {
      return;
    }

    this.isLoading.set(true);
    this.http.get<any[]>('/api/auth/branches').subscribe({
      next: (branches) => {
        const branch = branches.find(b => b.id === this.storeId);
        if (branch) {
          this.formName.set(branch.name);
          this.formType.set(branch.branch_type || 'retail');
          this.formLocation.set(branch.location || '');
          this.formIsActive.set(branch.is_active !== false);

          // Update map position if map is initialized
          if (this.map && this.marker && branch.location) {
            const match = branch.location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
            if (match) {
              const lat = parseFloat(match[1]);
              const lng = parseFloat(match[2]);
              this.map.setView([lat, lng], 14);
              this.marker.setLatLng([lat, lng]);
            }
          }
        } else {
          this.errorMessage.set('Store or warehouse record not found.');
        }
        this.isLoading.set(false);
        setTimeout(() => {
          this.initMap();
        }, 150);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Failed to load store details.');
        this.isLoading.set(false);
        setTimeout(() => {
          this.initMap();
        }, 150);
      }
    });
  }

  private ensureLeafletStylesheet() {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'assets/leaflet/leaflet.css';
    document.head.appendChild(link);
  }

  async initMap() {
    if (this.map) {
      return;
    }
    try {
      // Loaded on demand so the map library never blocks pages that don't need it.
      this.ensureLeafletStylesheet();
      const L = this.leaflet ?? ((this.leaflet = await import('leaflet')));

      let lat = 25.2048;
      let lng = 55.2708;

      const currentLoc = this.formLocation();
      const match = currentLoc.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }

      this.map = L.map('map-picker-container').setView([lat, lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      const goldIcon = L.divIcon({
        html: `
          <div class="gold-marker-pin"></div>
          <div class="pulse"></div>
        `,
        className: 'custom-gold-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      this.marker = L.marker([lat, lng], {
        draggable: true,
        icon: goldIcon
      }).addTo(this.map);

      this.marker.on('dragend', () => {
        const position = this.marker!.getLatLng();
        this.updateLocationFromLatLng(position.lat, position.lng);
      });

      this.map.on('click', (e: Leaflet.LeafletMouseEvent) => {
        this.marker!.setLatLng(e.latlng);
        this.updateLocationFromLatLng(e.latlng.lat, e.latlng.lng);
      });
    } catch (e) {
      console.error('Failed to init Leaflet Map picker:', e);
    }
  }

  updateLocationFromLatLng(lat: number, lng: number) {
    const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    this.formLocation.set(coordsStr);
  }

  useCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (this.map && this.marker) {
          this.map.setView([lat, lng], 15);
          this.marker.setLatLng([lat, lng]);
          this.updateLocationFromLatLng(lat, lng);
        }
      }, (err) => {
        console.warn('Geolocation failed:', err);
      });
    }
  }

  saveStore() {
    const name = this.formName().trim();
    const branchType = this.formType();
    const location = this.formLocation().trim();
    const isActive = this.formIsActive();

    if (!name) {
      this.errorMessage.set(this.translate.instant('USERS.FILL_REQUIRED_FIELDS'));
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = { name, branchType, location, isActive };

    if (this.isEditMode && this.storeId) {
      this.http.put(`/api/auth/branches/${this.storeId}`, payload).subscribe({
        next: () => {
          this.showSuccess('Store updated successfully.');
          setTimeout(() => this.router.navigate(['/stores']), 1500);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set('Failed to update store.');
          this.isLoading.set(false);
        }
      });
    } else {
      this.http.post('/api/auth/branches', payload).subscribe({
        next: () => {
          this.showSuccess('Store created successfully.');
          setTimeout(() => this.router.navigate(['/stores']), 1500);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set('Failed to create store.');
          this.isLoading.set(false);
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/stores']);
  }

  showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
