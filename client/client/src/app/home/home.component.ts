import { Component, OnInit } from '@angular/core';
import { DefaultService } from '../../api/index';
import { Zoo } from '../../api/model/zoo';
import { useAnimation } from '@angular/core/src/animation/dsl';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  private animalName:String = '';
  private animalSpecies:String;

  private zoo:Zoo;
  
  public get useHashgraph():string {
    return this.service.useHashgraph.toString();
  }

  public set useHashgraph(useHashgraph:string) {
    this.service.useHashgraph = useHashgraph === 'true';
  }

  constructor(private service:DefaultService) {
    this.refreshZoo();
    setInterval(() => this.refreshZoo(), 2000);
  }

  private addAnimal():void {
    let animal:any = {name: this.animalName, species: this.animalSpecies};
    this.service.addAnimal(animal).subscribe(_ => {
      this.animalName = '';
      this.animalSpecies = undefined;
      this.refreshZoo();
    });
  }

  private refreshZoo() {
    this.service.getZoo().subscribe(result => this.zoo = result );
  }

  ngOnInit() {
  }

}