import { Component, Input, OnInit } from '@angular/core';

declare var adsbygoogle: any[];

@Component({
  selector: 'app-adsense-banner',
  templateUrl: './adsense-banner.component.html',
  styleUrls: ['./adsense-banner.component.scss'],
  imports: [],
})
export class AdsenseBannerComponent {

  @Input() adClient: string = 'ca-pub-8289024792996841'; // Tu ID de cliente
  @Input() adSlot!: string;                             // ID del bloque de anuncio
  @Input() adFormat: string = 'auto';
  @Input() responsive: boolean = true;

  ngAfterViewInit(): void {
    try {
      // Empuja y renderiza el anuncio en el DOM de la SPA
      (adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error('Error cargando AdSense:', e);
    }
  }

}
