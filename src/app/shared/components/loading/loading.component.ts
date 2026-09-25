import { Component, inject, OnInit } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  imports: [],
})
export class LoadingComponent {

  public loadingService = inject(LoadingService)

  constructor() { }

}
