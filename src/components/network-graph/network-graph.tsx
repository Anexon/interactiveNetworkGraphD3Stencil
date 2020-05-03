import { Prop, Element, Component, ComponentInterface, Host, h } from '@stencil/core';
import { NetworkLink } from '../../utils/models/network-link';
import { NetworkNode, NetworkNodeType } from '../../utils/models/network-node';
import { select, event } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { zoom, zoomIdentity } from 'd3-zoom';
import { drag } from 'd3-drag';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';

@Component({
  tag: 'network-graph',
  styleUrl: 'network-graph.css',
  shadow: true,
})
export class NetworkGraph implements ComponentInterface {


    // TODO: Graficar contenido con mas estilo
    
  @Prop() nodes: NetworkNode[] = [];
  @Prop() links: NetworkLink[] = [];
  @Element() element: HTMLElement;

  width: number;
  height: number;

  context: CanvasRenderingContext2D;

  simulation: any;
  transform: any;
  
  radiusLowerLimit: number = 10;
  radiusUpperLimit: number = 30;

  lineWidthLowerLimit: number = 1;
  lineWidthUpperLimit: number = 10;

  nodeRadiusScale;
  linkWidthScale;

  componentDidLoad() {
    this.initializeScales();

    let canvas = this.element.shadowRoot.querySelectorAll("canvas")[0] as HTMLCanvasElement;
    this.context = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;


    this.transform = zoomIdentity;
    this.simulation = forceSimulation(this.nodes)
        .force("link", forceLink()
            .id((d)=>{ return d.id; })
            .links(this.links)
            .distance(50)
        )
        .force("charge", forceManyBody().strength(-50).distanceMax(200))
        .force("center", forceCenter(this.width / 2, this.height / 2))     
        .on("tick", ()=>this.draw());

    select(canvas)
        .call(drag()
            .container(canvas)
            .subject(()=>{
                let foundNode;
                this.nodes.forEach(node=>{
                  let dx = this.transform.invertX(event.x) - node.x;
                  let dy = this.transform.invertY(event.y) - node.y;
            
                  // Check if clicked location is inside circle of node center point
                  if (dx * dx + dy * dy < this.nodeRadiusScale(node.appearances) * this.nodeRadiusScale(node.appearances)) {
                    foundNode = node;
                  }
                })

                // Alternative when unique radius is used
                //
                // return this.simulation.find(this.transform.invertX(event.x), 
                //     this.transform.invertY(event.y), 
                //     this.radius);

                return foundNode;
            })
            .on("start", ()=>{
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on("drag", ()=>{
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            })
            .on("end", ()=>{
                if (!event.active) this.simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }))
        .call(zoom().scaleExtent([1 / 10, 8]).on("zoom", ()=>{
            this.transform = event.transform;
            this.draw();
        }));
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

  draw(){
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.save();
       
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);

    this.links.forEach((link) => this.drawLink(link));

    this.nodes.forEach(node=>this.drawNode(node));

    this.context.stroke(); 

    this.context.restore();
  }

  drawNode(node: NetworkNode){
      let radius = this.radiusLowerLimit;

      this.context.beginPath();
      this.context.lineWidth = 0;
      if(node.type == NetworkNodeType.Worker){
        radius = this.radiusLowerLimit / 2;
        this.context.fillStyle = "#1abc9c";
      } else {
        this.context.fillStyle = "#2980b9";
        radius = this.nodeRadiusScale(node.appearances);
      }
      this.context.moveTo(node.x, node.y);
      this.context.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      
      this.context.strokeStyle = "transparent";
      this.context.fill();
  }

  drawLink(link: NetworkLink){
      this.context.beginPath();
      this.context.moveTo(link.source.x, link.source.y);
      this.context.lineTo(link.target.x, link.target.y);
      this.context.lineWidth = this.linkWidthScale(link.interactions);
      this.context.strokeStyle = "#aaa";
      this.context.stroke();
  }

  render() {
    return (
        <Host>
          <canvas width="600" height="500"></canvas>
        </Host>
    );
  }

}