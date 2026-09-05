import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Layout } from '@frontend/ui';

@Component({
  imports: [Layout],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected title = 'gold-erp';
}
