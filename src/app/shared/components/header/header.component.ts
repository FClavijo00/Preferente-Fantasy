import { Component, Input, OnInit } from '@angular/core';
import { IonTitle, IonHeader, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [IonToolbar, IonHeader],
})
export class HeaderComponent implements OnInit {
  @Input() titulo: string = '';

  constructor() { }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit() { }
}
