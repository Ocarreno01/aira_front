import { Component, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../../core/material.module';
import { AppRevenueUpdatesComponent } from 'src/app/template/components/revenue-updates/revenue-updates.component';
import { AppYearlyBreakupComponent } from 'src/app/template/components/yearly-breakup/yearly-breakup.component';
import { AppMonthlyEarningsComponent } from 'src/app/template/components/monthly-earnings/monthly-earnings.component';
import { AppRecentTransactionsComponent } from 'src/app/template/components/recent-transactions/recent-transactions.component';
import { AppTopProjectsComponent } from 'src/app/template/components/top-projects/top-projects.component';
import { AppBlogCardsComponent } from 'src/app/template/components/blog-card/blog-card.component';

@Component({
  selector: 'app-starter',
  imports: [
    MaterialModule,
    AppRevenueUpdatesComponent,
    AppYearlyBreakupComponent,
    AppMonthlyEarningsComponent,
    AppRecentTransactionsComponent,
    AppTopProjectsComponent,
    AppBlogCardsComponent,
  ],
  templateUrl: './starter.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent {}
