import { Component, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { AppRevenueUpdatesComponent } from 'src/app/template/components/revenue-updates/revenue-updates.component';
import { AppYearlyBreakupComponent } from 'src/app/template/components/yearly-breakup/yearly-breakup.component';
import { AppMonthlyEarningsComponent } from 'src/app/template/components/monthly-earnings/monthly-earnings.component';
import { AppRecentTransactionsComponent } from 'src/app/template/components/recent-transactions/recent-transactions.component';
import { AppTopProjectsComponent } from 'src/app/template/components/top-projects/top-projects.component';
import { AppBlogCardsComponent } from 'src/app/template/components/blog-card/blog-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    MaterialModule,
    AppRevenueUpdatesComponent,
    AppYearlyBreakupComponent,
    AppMonthlyEarningsComponent,
    AppRecentTransactionsComponent,
    AppTopProjectsComponent,
    AppBlogCardsComponent,
  ],
  templateUrl: './dashboard.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent {}
