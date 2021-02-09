import Oviz from "crux";
import template from "./template.bvt"
import {ComplexScatterplot} from "./complex-scatterplot"
import { editorRef, editorConfig } from "./editor";
import { registerEditorConfig } from "utils/editor";

import {groupedChartColors} from "oviz-common/palette";
import {getGroups, groupBy}from "utils/array"
import {register} from "page/visualizers";
import {rankDict} from "utils/bio-info.ts";

import * as _ from "lodash";

const MODULE_NAME = 'scatterplot'

function init() {
    if (!window.gon || window.gon.module_name !== MODULE_NAME) return;

    const {visualizer} = Oviz.visualize({
        el: "#canvas",
        renderer: "svg",
        root: new ComplexScatterplot(),
        data: {
            colors: groupedChartColors.slice(0,3),
            config: {
                plotHeight: 500,
                plotWidth: 500,
                rankIndex: 0,
                xAxisIndex:0,
                yAxisIndex:1,
                computeOval: false,
                categoryRange: [null, null],
                valueRange: [null, null],
                scatterSize: 8,
                hollow: false,
                showErrorEllipse: true,
            },
            vectorLabel: null,
        },
        loadData: {
            scatterData: {
                fileKey: "scatterData",
                type: "tsv",
                multiple: true,
                dsvRowParser (row, _, columns) {
                    row["sampleId"] = row[columns[0]];
                    delete row[columns[0]];
                    for (let i = 1; i< columns.length; i++)
                        row[columns[i]] = parseFloat(row[columns[i]]);
                    return row;
                },
                loaded(d) {
                    const rankKeys = Object.keys(rankDict);
                    this.data.ranks = d.map(x => x.columns[0])
                                    .sort((a, b) => rankKeys.indexOf(a) - rankKeys.indexOf(b))
                                    .map((x, i) =>  ({value: i, text: rankDict[x]}))
                    // this.data.ranks = d.map((x, i) => ({value: i, text: x.columns[0]}));
                    this.data.samples = d[0].map(x => x["sampleId"]);
                    const mainDict = {};
                    d.forEach(data => {
                        mainDict[rankDict[data.columns[0]]] = data;
                    });
                    const selectedDataCols = d[0].columns;
                    this.data.availableAxises = selectedDataCols.filter((_, i) => i > 0)
                                .map((x,i) => ({"value": i, "text": x}));
                    this.data.mainDict = mainDict;
                    this.data.rankLabel = this.data.ranks[0].text;
                    this.data.sampleInfoDict = {};
                    this.data.samples.forEach(k =>this.data.sampleInfoDict[k] = {});
                    return mainDict[this.data.rankLabel];
                }
            },
            scatterGroupData: {
                fileKey: "scatterGroupData",
                type: "tsv",
                optional: true,
                dependsOn: ["scatterData"],
                loaded(data) {
                    if (!data) return;
                    console.log(data);
                    this.data.groups = getGroups(data, data.columns[1]);
                    
                    this.data.samples.forEach(s => {
                        data.forEach((group, i, arr) => {
                            if(group[data.columns[0]] === s){
                                this.data.sampleInfoDict[s].group = group[data.columns[1]];
                                arr.slice(i, 1);
                            }
                        })
                    });
                    return null;
                }
            },
            scatterVectorData: {
                fileKey: "scatterVectorData",
                type: "tsv",
                optional: true,
                dependsOn: ["scatterData"],
                dsvRowParser (row, _,columns) {
                    for (let i = 1; i< columns.length; i++)
                        row[columns[i]] = parseFloat(row[columns[i]]);
                    return row;
                },
                loaded(data) {
                    if (!data) return;
                    this.data.vectorLabel = data.columns[0];
                }
            },
            scatterClusterData: {
                fileKey: "scatterClusterData",
                type: "tsv",
                optional: true,
                multiple: true,
                dependsOn: ["scatterData"],
                loaded(d) {
                    if (!d) return;
                    this.data.clusterDict = {};
                    d.forEach(x => {
                        const rankK = rankDict[x.columns[0]];
                        const sampleK = x.columns[0];
                        const clusterK = x.columns[1];
                        x.forEach(r => {
                            if (!this.data.clusterDict[r[sampleK]])
                                this.data.clusterDict[r[sampleK]] = {};
                            this.data.clusterDict[r[sampleK]][rankK] = r[clusterK];
                        });
                    });
                    const chosenRank = this.data.ranks[0].text;
                    const data = Object.keys(this.data.clusterDict).map(k => this.data.clusterDict[k]);
                    this.data.clusters = Object.keys(_.groupBy(data, chosenRank));
                    // data.forEach((cluster, i, arr) => 
                    //     this.data.samples.forEach(s => {
                    //         if(cluster["sampleId"] === s){
                    //             this.data.sampleInfoDict[s].cluster = cluster.cluster;
                    //             arr.slice(i, 1);
                    //         }
                    //     })
                    // );
                    return null;
                }
            }
        },
        setup() {
            console.log(this["_data"]);
            registerEditorConfig(editorConfig(this), editorRef);
        }
    }); 
    
    return visualizer;
}

register(MODULE_NAME, init);

export function registerScatterplot(){
    register(MODULE_NAME, init);
}