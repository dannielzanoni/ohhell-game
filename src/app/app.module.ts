import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { FormsModule } from '@angular/forms';
import { ViewGamesComponent } from './view-games/view-games.component';
import { InputTextModule } from 'primeng/inputtext';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { HowToPlayComponent } from './how-to-play/how-to-play.component';
import { PlayerFormsComponent } from './player-forms/player-forms.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GameComponent,
    ViewGamesComponent,
    HowToPlayComponent,
    PlayerFormsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    InputTextModule,
    BrowserAnimationsModule,
    ButtonModule,
    FloatLabelModule
  ],
  providers: [

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
