import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RoomComponent } from './room/room.component';
import { EntryRoomComponent } from './entry-room/entry-room.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'entry-room/:roomId', component: EntryRoomComponent },
  { path: 'room/:roomId/:userName/:profilePicture', component: RoomComponent }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
