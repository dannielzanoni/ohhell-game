import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { ViewGamesComponent } from './view-games/view-games.component';
import { HowToPlayComponent } from './how-to-play/how-to-play.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game/:id', component: GameComponent },
  { path: 'viewgames', component: ViewGamesComponent },
  { path: 'howtoplay', component: HowToPlayComponent }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
