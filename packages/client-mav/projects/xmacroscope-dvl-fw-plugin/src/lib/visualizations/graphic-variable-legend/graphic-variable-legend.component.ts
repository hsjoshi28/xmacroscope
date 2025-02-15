import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { OnGraphicSymbolChange, OnPropertyChange } from '@dvl-fw/angular';
import {
  DefaultGraphicSymbol, GraphicSymbol, GraphicVariable, Project, Visualization, VisualizationComponent,
} from '@dvl-fw/core';

import { XMacroscopeDataService } from '../../shared/xmacroscope-data.service';
import { SymbolLegendVisualization } from '../symbol-legend/symbol-legend.visualization';


@Component({
  selector: 'mav-graphic-variable-legend',
  templateUrl: './graphic-variable-legend.component.html',
  styleUrls: ['./graphic-variable-legend.component.scss']
})
export class GraphicVariableLegendComponent implements VisualizationComponent,
  OnChanges, OnInit, OnPropertyChange, OnGraphicSymbolChange {
  @Input() data!: Visualization;
  legend!: Visualization;

  constructor(private xMacroscopeDataService: XMacroscopeDataService) { }

  refreshItems(): void {
    if (this.data) {
      // FIXME: Remove specifics to xMacroscope
      const project = (this.data as { project?: Project })?.project ?? this.xMacroscopeDataService.project;
      const allGraphicSymbols = this.data.graphicSymbols ?? {};
      const allSlots = Object.keys(allGraphicSymbols);
      const slot = allSlots.length && allSlots[0];
      const gs = allGraphicSymbols[slot];
      const gv = gs.graphicVariables[this.data.properties['graphicVariable'] as string];
      const itemDefaults = this.data.properties['itemDefaults'] || undefined;

      if (gs && gv) {
        const graphicSymbol = this.createGraphicSymbol(gv, gs, project);
        this.legend = this.createLegend(this.data.id, graphicSymbol, { itemDefaults }, project);
      }
    }
  }

  private createLegend(
    id: string,
    graphicSymbol: GraphicSymbol,
    properties: Record<string, unknown>,
    project: Project
  ): Visualization {
    const visualization = new SymbolLegendVisualization({
      id,
      template: 'symbol-legend',
      properties,
      graphicSymbols: {}
    }, project);
    visualization.graphicSymbols = { items: graphicSymbol };

    return visualization;
  }

  private createGraphicSymbol(
    graphicVariable: GraphicVariable,
    sourceGraphicSymbol: GraphicSymbol,
    project: Project
  ): GraphicSymbol {
    const gvars: Record<string, GraphicVariable> = {};
    for (const gv of project.graphicVariables) {
      if (gv.dataVariable === graphicVariable.dataVariable && !gvars[gv.type]) {
        gvars[gv.type] = gv;
      }
    }
    const graphicVariables: Record<string, GraphicVariable> = {
      identifier: sourceGraphicSymbol.graphicVariables.identifier,
      [graphicVariable.type]: graphicVariable,
      value: graphicVariable,
      input: gvars.input,
      label: gvars.label,
      order: gvars.order
    };

    const graphicSymbol = new DefaultGraphicSymbol({
      id: 'items',
      type: sourceGraphicSymbol.type,
      recordStream: sourceGraphicSymbol.recordStream.id,
      graphicVariables: {}
    }, project);
    graphicSymbol.graphicVariables = graphicVariables;

    return graphicSymbol;
  }

  ngOnInit(): void {
    this.refreshItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('data' in changes) {
      this.refreshItems();
    }
  }

  dvlOnGraphicSymbolChange(_changes: SimpleChanges): void {
    this.refreshItems();
  }

  dvlOnPropertyChange(changes: SimpleChanges): void {
    if ('graphicVariable' in changes || 'itemDefaults' in changes) {
      this.refreshItems();
    }
  }
}
