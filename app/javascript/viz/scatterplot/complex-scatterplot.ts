import Oviz from "crux";
import { Component, ComponentOption } from "crux/dist/element";
import { findBoundsForValues } from "utils/maths";
import template from "./template.bvt";

// export interface ComplexScatterplotOption extends ComponentOption{
//     plotSize: {w:number, h:number},
//     colors: string[],
//     valueRange: Array<number>,
//     categoryRange: Array<number>,
//     scatterData: any[],
//     scatterColumns: string[],
//     vectorData: any[],
//     vectorLabel?: string,
//     clusters: string[],
//     groups: string[],
//     xAxisIndex: number,
//     yAxisIndex: number,
//     scatterSize: number,
//     hollow: boolean,
//     showErrorEllipse: boolean,
// }
export interface ErrorEllipseDatum {
    dx: number,
    dy: number,
    ellipsePath: string,
    xAxisPath: string,
    yAxisPath: string,
}

export interface ScatterClusterDatum {
    center: {x,y},
    ellipseData: ErrorEllipseDatum 
}
export class ComplexScatterplot extends Component<ComponentOption> {

    public dataChanged: boolean = true;
    public mainDict;
    public config: any;
    public colors: string;
    public ranks: any[];
    public scatterColumns: any[];
    public scatterData: any[];
    public scatterVectorData: any[];
    public vectorLabel: string;
    public groups: string[];
    public clusters: string[];
    public clusterData: any[];

    private parsedScatterData: any[];
    private parsedClusterData: Record<string, ScatterClusterDatum>;
    private rankLabel;
    private xLabel;
    private categoryRange;
    private yLabel;
    private valueRange;


    private shapeMap:Map<string, string>;
    private colorMap:Map<string|number, string>;

    private legend2Pos: {x:number, y:number};

    private legend1Pos: {x:number, y:number};

    public render = Oviz.t`${template}`;

    willRender() {
        if (this._firstRender) {
            this.legend1Pos = {x:45, y:115};
            this.legend2Pos = {x:45, y:55};
            const shapes = ["Circle", "Rect", "Triangle"];
            if (this.clusters) {
                this.colorMap = this.getMap(this.clusters, this.colors);
                if (this.groups) {                
                    this.shapeMap = this.getMap(this.groups, shapes);
                }
            } else if (this.groups) {
                this.colorMap = this.getMap(this.groups, this.colors);
            }
        }

        if (this.dataChanged) {
            this.rankLabel = this.ranks[this.config.rankIndex].text;
            this.scatterData = this.mainDict[this.rankLabel];
            this.xLabel = this.scatterColumns[this.config.xAxisIndex];
            this.yLabel = this.scatterColumns[this.config.yAxisIndex];
            this.parsedScatterData = this.scatterData.map(d => {
                const datum = {sampleId: d.sampleId, group: d.group, cluster: d.cluster};
                datum[this.xLabel] = d[this.xLabel];
                datum[this.yLabel] = d[this.yLabel];
                return datum;
            });

            if (this.clusters) {
                this.categoryRange = this.rangeIsValid(this.config.categoryRange) ?  this.config.categoryRange
                    : findBoundsForValues(this.scatterData.map(d => d[this.xLabel]), 1, false, 0.1);
                this.valueRange = this.rangeIsValid(this.config.valueRange) ? this.config.valueRange
                    : findBoundsForValues(this.scatterData.map(d => d[this.yLabel]), 1, false, 0.1);
            } else {
                this.categoryRange = this.rangeIsValid(this.config.categoryRange) ?  this.config.categoryRange
                : findBoundsForValues(this.scatterData.map(d => d[this.xLabel]), 1);
                this.valueRange = this.rangeIsValid(this.config.valueRange) ? this.config.valueRange
                    : findBoundsForValues(this.scatterData.map(d => d[this.yLabel]), 1);
            }        

            const svgRatioX = this.config.plotWidth / (this.categoryRange[1] - this.categoryRange[0]);
            const svgRatioY = this.config.plotHeight / (this.valueRange[1] - this.valueRange[0]);

            if (this.clusters) {
                const parsedData = {};
                this.clusters.forEach(key => {
                    const initialData = this.parsedScatterData.filter(d => d.cluster === key);
                    const clusterDatum = this.computeErrorEllipse(initialData, this.xLabel, this.yLabel,
                        svgRatioX, svgRatioY);
                        parsedData[key] = clusterDatum;
                })
                this.parsedClusterData = parsedData;
            }
            if (this.clusters) {
                this.colorMap = this.getMap(this.clusters, this.colors);
            } else if (this.groups) {
                this.colorMap = this.getMap(this.groups, this.colors);
            }
            this.dataChanged = false;
        }
        console.log(this.scatterData);
    }

    protected rangeIsValid(range:Array<Number>) :boolean {
        if (!!range && !!range[0] && !!range[1]) return true;
        return false;
    }

    protected computeErrorEllipse(samples, xIndex, yIndex, svgRatioX, svgRatioY): ScatterClusterDatum {
        const ellipseData = {cx:0, cy:0, rx:0, ry:0, rotationAngle:0};
        const s = 5.991;
        const statX = new Oviz.algo.Statistics(samples.map(x => x[xIndex]));
        const statY = new Oviz.algo.Statistics(samples.map(y => y[yIndex]));
    
        ellipseData.cx =  statX.mean();
        ellipseData.cy = statY.mean();
        
        let varX = 0, varY = 0, cov = 0;
        samples.forEach(d => {
            varX += Math.pow( (d[xIndex] - statX.mean()) * svgRatioX, 2) / (samples.length-1);
            varY += Math.pow( (d[yIndex] - statY.mean()) * svgRatioY, 2) / (samples.length-1);
            cov += (d[xIndex] - statX.mean()) * svgRatioX * (d[yIndex] - statY.mean()) * svgRatioY / (samples.length-1);
        })

        const eParams = {a: 1, b: -(varX+varY), c: varX*varY - Math.pow(cov, 2)};
        const eigenValue1 = (-eParams.b + Math.sqrt(Math.pow(eParams.b,2) - 4*eParams.a*eParams.c))/(2*eParams.a);
        const eigenValue2 = (-eParams.b - Math.sqrt(Math.pow(eParams.b,2) - 4*eParams.a*eParams.c))/(2*eParams.a);
        ellipseData.rx = Math.sqrt(s * Math.abs(eigenValue1));
        ellipseData.ry = Math.sqrt(s * Math.abs(eigenValue2));
        
        const rotationRad = Math.atan((varX -eigenValue1)/cov);
        ellipseData.rotationAngle  = rotationRad*180/Math.PI;
        const triFunctions = {
            sin(r) {return r * Math.sin(rotationRad)}, 
            cos(r) {return r * Math.cos(rotationRad)}
        };
        const dx = triFunctions.cos(ellipseData.rx);
        const dy = triFunctions.sin(ellipseData.rx);
        const ellipsePath = `M 0 0 
                    A ${ellipseData.rx} ${ellipseData.ry} ${ellipseData.rotationAngle} 0 1 ${2*dx} ${2*dy}
                    A ${ellipseData.rx} ${ellipseData.ry} ${ellipseData.rotationAngle} 0 1 0 0 Z`;
        const center = {x:statX.mean(), y:statY.mean()};
        const ellipseDatum = {
            dx,
            dy,
            ellipsePath,
            xAxisPath: `M 0 0 L ${2*dx} ${2*dy}`,
            yAxisPath: `M ${dx - triFunctions.sin(ellipseData.ry)} ${dy + triFunctions.cos(ellipseData.ry)} L ${dx + triFunctions.sin(ellipseData.ry)} ${dy - triFunctions.cos(ellipseData.ry)}`,
        }
        return {center, ellipseData: ellipseDatum};
    }


    protected generateScatterContent(scatter){
        return Object.keys(scatter)
                     .reduce(((acc, cur) => {
                        if (!!scatter[cur]) 
                            if (typeof scatter[cur] === "number")
                                return acc + `${cur}: ${scatter[cur].toFixed(3)}<br>`;
                            else
                                return acc + `${cur}: ${scatter[cur]}<br>`;
                        else return acc;
                }), "");
    }

    
    protected getMap(keyArray, valueArray) {
        const map = new Map();
        keyArray.forEach((key,i) => {
            map.set(key, valueArray[i]);
        });
        return map;
    }

    protected dragStart(_, el) {
        el.$parent.$on['mousemove'] = (evp, elp) => {
            let [newX, newY] = Oviz.utils.mouse(elp, evp);
            if (el.id === "legend1") {
                this.legend1Pos = {x: newX, y: newY};
            } else {
                this.legend2Pos = {x: newX, y: newY};
            }
            this.setState({newX, newY});
        }
        el.stage = "dragging";
    }

    protected dragEnd(_, el) {
        delete el.$parent.$on['mousemove'];
        el.stage = null;
        this.setState({newX:null, newY:null});
    }
}