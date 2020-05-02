import { Prop, Element, Component, ComponentInterface, Host, h } from '@stencil/core';
import { NetworkLink } from '../../utils/models/network-link';
import { NetworkNode, NetworkNodeType } from '../../utils/models/network-node';
import { select, event } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { zoom } from 'd3-zoom';
import { drag } from 'd3-drag';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';

@Component({
  tag: 'network-graph-svg',
  styleUrl: 'network-graph-svg.css',
  shadow: true,
})
export class NetworkGraphSvg implements ComponentInterface {

  @Prop() nodes: NetworkNode[] = [];
  @Prop() links: NetworkLink[] = [];
  @Element() element: HTMLElement;

  width: number = 600;
  height: number = 500;

  context: CanvasRenderingContext2D;

  radiusLowerLimit: number = 10;
  radiusUpperLimit: number = 30;

  lineWidthLowerLimit: number = 1;
  lineWidthUpperLimit: number = 10;

  simulation;
  svgCircles;
  svgNodes;
  svgLinks;

  nodeRadiusScale: Function;
  linkWidthScale: Function;

  
  componentDidLoad() {
    this.initializeScales();

    let svg = select(this.element.shadowRoot.querySelectorAll("svg")[0])
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 600 500")
        .call(zoom().on("zoom",  (_)=>{svg.attr("transform", event.transform)}))
        .append("g");

    this.loadSVGElements(svg);
    this.simulation = forceSimulation(this.nodes)
    .force("link", forceLink()
        .id(function (d) { return d.id; })
        .links(this.links)
        .distance(50)
    )
    .force("charge", forceManyBody().strength(-50).distanceMax(200))
    .force("center", forceCenter(this.width / 2, this.height / 2))     
    .on("tick", ()=>this.draw());
  }

  initializeScales(){
    let nodeAppearancesRange = [Math.min(...this.nodes.map(n=>n.appearances)), Math.max(...this.nodes.map(n=>n.appearances))];
    this.nodeRadiusScale = scaleLinear()
      .domain(nodeAppearancesRange)
      .range([this.radiusLowerLimit, this.radiusUpperLimit])
      .clamp(true);

    let linkWidthRange = [Math.min(...this.links.map(n=>n.interactions)), Math.max(...this.links.map(n=>n.interactions))];
    this.linkWidthScale = scaleLinear()
      .domain(linkWidthRange)
      .range([this.lineWidthLowerLimit, this.lineWidthUpperLimit])
      .clamp(true);
  }

  loadSVGElements(svg){
    this.svgLinks = svg
        .selectAll("line")
        .data(this.links)
        .enter()
        .append("line")
        .style("stroke", (_) => "#aaa")
        .style("stroke-width", (d) => this.linkWidthScale(d.interactions));

    this.svgNodes = svg
        .selectAll("g")
        .data(this.nodes)
        .enter()
            .append("g")
            .call(drag()
                .on('start', d => {
                    if (!event.active) this.simulation.alphaTarget(0.3).restart()
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', d => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', d => {
                    if (!event.active) this.simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

    this.svgCircles = this.svgNodes.append("circle")
            .attr("r", node => node.type == NetworkNodeType.Worker ? this.radiusLowerLimit/2 : this.nodeRadiusScale(node.appearances))
            .style("fill", node => node.type == NetworkNodeType.Employer ? "#2980b9" : "#1abc9c")

  }

  draw(){
    this.svgLinks
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    this.svgNodes
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; });
    this.svgCircles
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });
  }


  render() {
    return (
        <Host>
          <svg width="600" height="500"/>
        </Host>
    );
  }

}