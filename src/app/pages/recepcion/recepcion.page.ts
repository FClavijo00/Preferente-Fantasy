import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonFabList,
  IonLabel,
  IonButton,
  ModalController,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowForwardOutline,
  keyOutline,
  peopleOutline,
  powerOutline,
  sparklesOutline,
  trophy,
  trophyOutline,
} from 'ionicons/icons';
import { CrearUnirCampeonatoComponent } from '../../shared/modals/crear-unir-campeonato/crear-unir-campeonato.component';
import { AuthService } from '../../core/services/auth-service.service';
import { LigasService } from '../../core/services/ligas.service';

interface Usuario {
  id: number;
  email: string;
  nombre_usuario: string;
  nombre_club: string;
  image_url: string;
  image: string;
  rol_id: number;
}

export interface Ligas {
  id: number;
  nombre_liga: string;
  privada: boolean;
  codigo_acceso: string | null;
  nombre_competicion: string;
  total_participantes: number;
}

@Component({
  selector: 'app-recepcion',
  templateUrl: './recepcion.page.html',
  styleUrls: ['./recepcion.page.scss'],
  imports: [
    IonButton,
    IonLabel,
    IonFabList,
    IonIcon,
    IonFabButton,
    IonFab,
    IonContent,
    CommonModule,
    FormsModule,
  ],
})
export class RecepcionPage implements OnInit {
  private _modalCtrl = inject(ModalController);
  private _authService = inject(AuthService);
  private _navCtrl = inject(NavController);
  private _ligasService = inject(LigasService);

  public user: Usuario | null = this._authService.currentUser();
  public misLigas = signal<Ligas[]>([]);

  constructor() {
    addIcons({
      addOutline,
      trophyOutline,
      trophy,
      keyOutline,
      arrowForwardOutline,
      powerOutline,
      peopleOutline,
      sparklesOutline
    });
  }

  async crearCampeonato() {
    const modal = await this._modalCtrl.create({
      component: CrearUnirCampeonatoComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        modo: 'crear',
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.cargasMisLigas();
    }
  }

  async unirseCampeonato() {
    const modal = await this._modalCtrl.create({
      component: CrearUnirCampeonatoComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        modo: 'unir',
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.cargasMisLigas();
    }
  }

  async cargasMisLigas() {
    const userId = this.user?.id;
    if (!userId) return;

    this._ligasService.getMisLigas().subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.misLigas.set(res.data);
        }
      },
    });
  }

  entrarEnLiga(liga: Ligas) {
    console.log(liga);
    /* this._navCtrl.navigateRoot(['/liga', liga.id], { replaceUrl: true }); */
    this._navCtrl.navigateRoot(['/tabs/home'], { replaceUrl: true });
  }

  logout() {
    this._authService.logout();
  }

  abrirPanelDeControl() {
    this._navCtrl.navigateRoot(['/panel-control'], { replaceUrl: true });
  }

  ngOnInit() {
    this.cargasMisLigas();
  }
}
