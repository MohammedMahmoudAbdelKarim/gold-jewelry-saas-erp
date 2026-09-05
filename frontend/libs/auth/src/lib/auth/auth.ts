import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'lib-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('cashier@test.com');
  password = signal('password123');
  tenantId = signal('e1a7b445-568d-4e96-a1ad-4672bb192bb3');
  
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    if (!this.email() || !this.password() || !this.tenantId()) {
      this.errorMessage.set('AUTH.ERROR_REQUIRED');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.email(), this.password(), this.tenantId()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'AUTH.ERROR_INVALID');
      },
    });
  }

  fillMockCredentials() {
    this.email.set('cashier@test.com');
    this.password.set('password123');
    this.tenantId.set('e1a7b445-568d-4e96-a1ad-4672bb192bb3');
  }
}
