import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RoomComponent } from './room/room.component';
import { ViewRoomsComponent } from './view-rooms/view-rooms.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'room', component: RoomComponent },
  { path: 'view-rooms', component: ViewRoomsComponent }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }