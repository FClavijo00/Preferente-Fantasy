import { Component, EnvironmentInjector, inject } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonButton
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { triangle, ellipse, square, home, homeOutline, shirt, shirtOutline, reader, readerOutline, podium, podiumOutline, trophy, trophyOutline, personCircle, personCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  currentTab: string = 'home';

  constructor() {
    addIcons({ 
      triangle,
      ellipse,
      square,
      home,
      homeOutline,
      shirt,
      shirtOutline,
      reader,
      readerOutline,
      podium,
      podiumOutline,
      trophy,
      trophyOutline,
      personCircle,
      personCircleOutline
     });
  }

  setCurrentTab(event: any) {
    this.currentTab = event.tab;
  }
}
