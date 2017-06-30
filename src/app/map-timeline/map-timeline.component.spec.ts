import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapTimelineComponent } from './map-timeline.component';

describe('MapTimelineComponent', () => {
  let component: MapTimelineComponent;
  let fixture: ComponentFixture<MapTimelineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapTimelineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
