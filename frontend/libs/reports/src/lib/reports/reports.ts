import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@frontend/core';
import { PageLoaderComponent } from '@frontend/ui';
import { ReportsApiService } from '../api/reports-api.service';
import { ReportsSummary, RecentSale } from '../models/reports.models';

@Component({
  selector: 'lib-reports',
  standalone: true,
  imports: [CommonModule, TranslatePipe, PageLoaderComponent],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports implements OnInit {
  private reportsApi = inject(ReportsApiService);
  public langService = inject(LanguageService);
  private translate = inject(TranslateService);

  summary = signal<ReportsSummary | null>(null);
  recentSales = signal<RecentSale[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.reportsApi.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(this.translate.instant('REPORTS.ERROR_LOAD'));
        this.isLoading.set(false);
      },
    });

    this.reportsApi.getRecentSales(8).subscribe({
      next: (data) => this.recentSales.set(data),
      error: (err) => console.error('Failed to load recent sales', err),
    });
  }
}
