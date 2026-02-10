import { Component } from '@angular/core';
import { CoreService } from 'src/app/core/features/common/services/core.service';

import { RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/core/material.module';

@Component({
  selector: 'app-blank',
  templateUrl: './blank.component.html',
  styleUrls: [],
  imports: [RouterOutlet, MaterialModule],
})
export class BlankComponent {
  private htmlElement!: HTMLHtmlElement;

  options = this.settings.getOptions();

  constructor(private settings: CoreService) {
    this.htmlElement = document.querySelector('html')!;
  }
}
