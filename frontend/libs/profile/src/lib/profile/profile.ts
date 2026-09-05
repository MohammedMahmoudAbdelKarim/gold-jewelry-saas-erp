import { ChangeDetectionStrategy, Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { AuthService, UserProfile } from '@frontend/auth';
import { InputMask } from 'primeng/inputmask';
import { DatePicker } from 'primeng/datepicker';

const PROFILE_STORAGE_KEY = 'aurum_user_profile';

@Component({
  selector: 'lib-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, InputMask, DatePicker],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  private title = inject(Title);
  private authService = inject(AuthService);

  saved = signal(false);
  editMode = signal(false);

  // Country Code State
  countries = [
    { name: 'Egypt', code: '+20', flag: '🇪🇬', countryCode: 'eg', mask: '999 999 9999', placeholder: '100 123 4567' },
    { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', countryCode: 'sa', mask: '9 9999 9999', placeholder: '5 1234 5678' },
    { name: 'UAE', code: '+971', flag: '🇦🇪', countryCode: 'ae', mask: '99 999 9999', placeholder: '50 123 4567' },
    { name: 'Kuwait', code: '+965', flag: '🇰🇼', countryCode: 'kw', mask: '9999 9999', placeholder: '9123 4567' },
  ];
  selectedCountry = signal(this.countries[0]);
  phoneLocalNumber = '';
  countryDropdownOpen = signal(false);

  // Map Picker State
  mapModalOpen = signal(false);
  mapLoading = signal(false);
  geocoding = signal(false);
  selectedLat = signal(30.0444);
  selectedLng = signal(31.2357);
  selectedAddressText = '';
  private leafletMap: any = null;
  private marker: any = null;

  birthdayDate: Date | null = null;

  profile = signal<UserProfile>({
    name: 'Mohammed Mahmoud',
    email: 'mohammed@gold-erp.com',
    phone: '+20 100 123 4567',
    address: 'Cairo, Egypt',
    birthday: '1990-05-15',
    avatarUrl: null,
  });

  // Editable copy
  editProfile = signal<UserProfile>({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthday: '',
    avatarUrl: null,
  });

  ngOnInit() {
    this.title.setTitle('Gold Jewelry ERP - Profile');
    this.loadProfile();
  }

  private loadProfile() {
    const activeProfile = this.authService.userProfile();
    if (activeProfile) {
      this.profile.set(activeProfile);
    } else {
      const currentUser = this.authService.currentUser();
      if (currentUser) {
        const defaultProfile: UserProfile = {
          name: currentUser.name,
          email: currentUser.email,
          phone: '',
          address: '',
          birthday: '',
          avatarUrl: null,
        };
        this.profile.set(defaultProfile);
        this.authService.updateProfile(defaultProfile);
      }
    }
  }

  startEdit() {
    this.editProfile.set({ ...this.profile() });
    this.birthdayDate = this.profile().birthday ? new Date(this.profile().birthday) : null;
    
    // Parse country code and local number from profile phone
    const fullPhone = this.profile().phone || '';
    let foundCountry = this.countries[0];
    let localNum = fullPhone;

    for (const c of this.countries) {
      if (fullPhone.startsWith(c.code)) {
        foundCountry = c;
        localNum = fullPhone.substring(c.code.length).trim();
        break;
      }
    }
    this.selectedCountry.set(foundCountry);
    this.phoneLocalNumber = localNum;
    this.editMode.set(true);
  }

  cancelEdit() {
    this.editMode.set(false);
  }

  saveProfile() {
    const updated = { ...this.editProfile() };
    updated.phone = `${this.selectedCountry().code} ${this.phoneLocalNumber}`.trim();
    if (this.birthdayDate) {
      const year = this.birthdayDate.getFullYear();
      const month = String(this.birthdayDate.getMonth() + 1).padStart(2, '0');
      const day = String(this.birthdayDate.getDate()).padStart(2, '0');
      updated.birthday = `${year}-${month}-${day}`;
    } else {
      updated.birthday = '';
    }
    this.profile.set(updated);
    this.authService.updateProfile(updated);
    this.editMode.set(false);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  onCountryCodeChange(code: string) {
    const country = this.countries.find(c => c.code === code);
    if (country) {
      this.selectedCountry.set(country);
    }
  }

  onPhoneLocalChange(val: string) {
    this.phoneLocalNumber = val;
  }

  toggleCountryDropdown(event: Event) {
    event.stopPropagation();
    this.countryDropdownOpen.update(v => !v);
  }

  selectCountryOption(country: any, event: Event) {
    event.stopPropagation();
    this.selectedCountry.set(country);
    this.countryDropdownOpen.set(false);
  }

  @HostListener('document:click')
  closeCountryDropdown() {
    this.countryDropdownOpen.set(false);
  }

  private loadLeaflet(): Promise<any> {
    if ((window as any).L) {
      return Promise.resolve((window as any).L);
    }
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve((window as any).L);
      script.onerror = () => reject(new Error('Failed to load Leaflet'));
      document.body.appendChild(script);
    });
  }

  openMapModal() {
    this.mapModalOpen.set(true);
    this.mapLoading.set(true);
    this.selectedAddressText = '';

    // Center Cairo default
    this.selectedLat.set(30.0444);
    this.selectedLng.set(31.2357);

    this.loadLeaflet().then((L) => {
      this.mapLoading.set(false);
      setTimeout(() => {
        const container = document.getElementById('map-container');
        if (!container) return;

        this.leafletMap = L.map('map-container').setView([this.selectedLat(), this.selectedLng()], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.leafletMap);

        // Custom gold marker design
        const goldIcon = L.divIcon({
          className: 'custom-gold-marker',
          html: `<div class="marker-pin-wrap">
                   <div class="marker-pin"></div>
                   <div class="marker-dot"></div>
                 </div>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42]
        });

        this.marker = L.marker([this.selectedLat(), this.selectedLng()], { 
          draggable: true,
          icon: goldIcon
        }).addTo(this.leafletMap);

        this.marker.on('dragend', () => {
          const position = this.marker.getLatLng();
          this.updatePosition(position.lat, position.lng, L);
        });

        this.leafletMap.on('click', (e: any) => {
          this.marker.setLatLng(e.latlng);
          this.updatePosition(e.latlng.lat, e.latlng.lng, L);
        });

        this.updatePosition(this.selectedLat(), this.selectedLng(), L);
      }, 100);
    }).catch(err => {
      console.error(err);
      this.mapLoading.set(false);
    });
  }

  private updatePosition(lat: number, lng: number, L: any) {
    this.selectedLat.set(lat);
    this.selectedLng.set(lng);
    this.geocoding.set(true);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`)
      .then(res => res.json())
      .then(data => {
        this.geocoding.set(false);
        if (data && data.display_name) {
          this.selectedAddressText = data.display_name;
        }
      })
      .catch(err => {
        this.geocoding.set(false);
        console.error('Geocoding error:', err);
      });
  }

  confirmMapLocation() {
    if (this.selectedAddressText) {
      this.editProfile.update(p => ({ ...p, address: this.selectedAddressText }));
    } else {
      this.editProfile.update(p => ({ ...p, address: `${this.selectedLat().toFixed(5)}, ${this.selectedLng().toFixed(5)}` }));
    }
    this.closeMapModal();
  }

  closeMapModal() {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
    this.marker = null;
    this.mapModalOpen.set(false);
  }

  onAvatarFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) return; // max 500KB

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (this.editMode()) {
        this.editProfile.update((p) => ({ ...p, avatarUrl: url }));
      } else {
        this.profile.update((p) => ({ ...p, avatarUrl: url }));
        this.authService.updateProfile(this.profile());
      }
    };
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    if (this.editMode()) {
      this.editProfile.update((p) => ({ ...p, avatarUrl: null }));
    } else {
      this.profile.update((p) => ({ ...p, avatarUrl: null }));
      this.authService.updateProfile(this.profile());
    }
  }

  getInitials(): string {
    const name = this.editMode() ? this.editProfile().name : this.profile().name;
    if (!name) return 'MM';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }

  getAvatarUrl(): string | null {
    return this.editMode() ? this.editProfile().avatarUrl : this.profile().avatarUrl;
  }

  formatBirthday(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
