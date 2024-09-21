import { Component } from '@angular/core';

@Component({
  selector: 'app-select-card-type',
  templateUrl: './select-card-type.component.html',
  styleUrl: './select-card-type.component.css'
})
export class SelectCardTypeComponent {
  selectedDeck: string = 'spain';

  selectDeck(deck: string) {
    this.selectedDeck = deck;
  }
}
