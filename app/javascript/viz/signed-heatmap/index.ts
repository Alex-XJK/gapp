import Oviz from "crux";
// import { template } from "./template";
import template from "./template.bvt"
import { processTreeData } from "./data";
import { SignedHeatMap } from "./signed-heatmap";
import { BinaryTree, Gravity } from "./binary-tree";
import {savedTheme} from "oviz-common/mem-theme"
// import { GradientDef } from "crux/dist/visualizer/visualizer";
// import { savedTheme } from "common/mem-theme";
// import { registerEditorConfig } from "utils/editor";
// import { editorConfig, editorRef } from "./editor";
// import { setSourceMapRange } from "typescript";

Oviz.use.theme("mh-dark", {
    extends: "dark",
    colors: {
        primary: "#5aae61",
        path: "white",
    },
    schemes: {
        discreteDataScheme: ["white", "grey", "red"],
    },
});

Oviz.use.theme("mh-light", {
    extends: "light",
    colors: {
        primary: "#5aae61",
        path: "black",
    },
    schemes: {
        discreteDataScheme: ["white", "grey", "red"],
    },
});

const dataList = ["heatmapData", "heatmapDataP", "groupData", "rowTreeData", "colTreeData"];

const SignedHeatmap = {
    initViz,
    initVizWithDeepomics,
}
function initVizWithDeepomics(fileDefs :any[]){
    const filePaths = {}
    fileDefs.forEach(f => {
        dataList.forEach( d => {
            if (f.dataType === d) {
                if (filePaths[d])
                    console.log("!error, duplicate data found");
                else // TODO: vunarable under different system, may need testing
                    filePaths[d] = btoa(f.path+'/'+f.name);
            }
        });
    });
    const vizOpts = generateDefaultVizOpts();
    dataList.forEach(data => {
        if(vizOpts.loadData[data])
            vizOpts.loadData[data].url = `api/public?path=${filePaths[data]||''}`
    });
    const {visualizer} = Oviz.visualize(vizOpts);

}
function initViz() {

    const filePath = btoa("/signed_heatmap/demo.csv");
    const vizOpts = {
        el: "#canvas",
        template,
        theme: savedTheme("mh"),
        components: {SignedHeatMap, BinaryTree},
        data: {
            config: {
                showPAnno: true,
                rangeMin: 0,
                rangeMax: 0,
                isSym: true,
                gridH: 15,
                rowTree: {
                    treeHeight: 200,
                    depthUnit: 0,
                    gravity: Gravity.Right,
                },
                colTree: {
                    treeHeight: 200,
                    depthUnit: 0,
                    gravity: Gravity.Bottom,
                },
            },
            colors: {
                "origin": "white",
                "positive range": "red",
                "negative range": "green",
                "group1": "#EC7063",
                "group2": "#58D68D",
            },
            groupData: null,
            rowTreeData: null,
            colTreeData: null,
        },
        loadData: {
            heatmapData: {
                type: "tsv",
                url: `api/local?path=${filePath}`,
                loaded(d) {
                    const rows = [];
                    const data = {};
                    let [min, max] = [0, 0];
                    d.forEach(line => {
                        const rowData = {};
                        const rowAttr = line[""];
                        rows.push(rowAttr);
                        d.columns.forEach(col => {
                            if (col === "") return;
                            const h = {};
                            h["r"] = line[col];
                            if (parseFloat(line[col]) > max) max = line[col];
                            if (parseFloat(line[col]) < min) min = line[col];
                            rowData[col] = h;
                        });
                        data[rowAttr] = rowData;
                    });
                    return {rows, columns: d.columns.splice(1, d.columns.length), data,
                        range: {min, max}};
                },
            },
            // heatmapDataP: {
            //     fileKey: "meta-dis-p",
            //     type: "tsv",
            //     dependsOn: ["heatmapData"],
            //     optional: true,
            //     loaded(d) {
            //         if (!d) return;
            //         for (let i = 0; i < d.length; i ++) {
            //             for (let j = 1; j < d.columns.length; j ++) {
            //                 this.data.heatmapData.data[i][j - 1]["p"] = d[i][d.columns[j]];
            //             }
            //         }
            //     },
            // },
            // groupData: {
            //     fileKey: "meta-heatmap-group",
            //     type: "tsv",
            //     loaded: function l(d) {
            //         if (!d) return;
            //         const phylums = {};
            //         const genus = [];
            //         d.forEach( s => {
            //             if (!phylums[s.Phylum])
            //                 phylums[s.Phylum] = [s.Genus];
            //             else if (!phylums[s.Phylum].includes(s.Genus))
            //                     phylums[s.Phylum].push(s.Genus);
            //         });
            //         Object.keys(phylums).forEach( k => {
            //             phylums[k] = phylums[k].sort();
            //             if (phylums[k].indexOf("Unknown") > 0) {
            //                 phylums[k].splice(phylums[k].indexOf("Unknown"), 1);
            //                 phylums[k].push("Other " + k);
            //             }
            //         });
            //         phylums["Other"] = ["Unclassified"];
            //         this.data.phylums = phylums;
            //         this.data.familyColorMap = initializeFamilyColors(phylums);
            //     },
            // },
            // rowTreeData: {
            //     fileKey: "pathway-enrich-tree",
            //     type: "newick",
            //     optional: true,
            //     loaded(d) {
            //         console.log(d);
            //         if (!d) return;
            //         d.depth = 0;
            //         d = processTreeData(d);
            //         console.log(d);
            //         return d;
            //     },
            // },
            // colTreeData: {
            //     fileKey: "pathway-tree-col",
            //     type: "newick",
            //     optional: true,
            //     loaded(d) {
            //         if (!d) return;
            //         d.depth = 0;
            //         d = processTreeData(d);
            //         return d;
            //     },
            // },
        },
        setup() {
            setUpRange(this);
            if (this.data.rowTreeData) setUpRowTree(this);
            if (this.data.colTreeData) setUpColTree(this);
            if (this.data.heatmapData.rows.length > 100) this.data.config.gridH = 10;
            else if (this.data.heatmapData.rows.length > 60) this.data.config.gridH = 12;
            // registerEditorConfig("signed-heatmap", editorConfig(this), [], editorRef);
        },
    }

    return {vizOpts};
}

function generateDefaultVizOpts(): any {
    const vizOpts = {
        el: "#canvas",
        template,
        theme: savedTheme("mh", "mh-light"),
        components: {SignedHeatMap, BinaryTree},
        data: {
            config: {
                showPAnno: true,
                rangeMin: 0,
                rangeMax: 0,
                isSym: true,
                gridH: 15,
                rowTree: {
                    treeHeight: 200,
                    depthUnit: 0,
                    gravity: Gravity.Right,
                },
                colTree: {
                    treeHeight: 200,
                    depthUnit: 0,
                    gravity: Gravity.Bottom,
                },
            },
            colors: {
                "origin": "white",
                "positive range": "red",
                "negative range": "green",
                "group1": "#EC7063",
                "group2": "#58D68D",
            },
            colTreeData: null,
        },
        loadData: {
            heatmapData: {
                type: "tsv",
                loaded(d) {
                    const rows = [];
                    const data = {};
                    let [min, max] = [0, 0];
                    d.forEach(line => {
                        const rowData = {};
                        const rowAttr = line[""];
                        rows.push(rowAttr);
                        d.columns.forEach(col => {
                            if (col === "") return;
                            const h = {};
                            h["r"] = line[col];
                            if (parseFloat(line[col]) > max) max = line[col];
                            if (parseFloat(line[col]) < min) min = line[col];
                            rowData[col] = h;
                        });
                        data[rowAttr] = rowData;
                    });
                    return {rows, columns: d.columns.splice(1, d.columns.length), data,
                        range: {min, max}};
                },
            },
            heatmapDataP: {
                type: "tsv",
                dependsOn: ["heatmapData"],
                optional: true,
                loaded(d) {
                    if (!d) return;
                    this.data.heatmapData.rows.forEach(r => {
                        d.forEach(line => {
                            if (line[""] === r) {
                                this.data.heatmapData.columns.forEach(c => {
                                    this.data.heatmapData.data[r][c]["p"] = line[c];
                                });
                                return;
                            }
                        });
                    });
                    return null;
                },
            },
            groupData: {
                type: "tsv",
                loaded: function l(d) {
                    if (!d) return;
                    const data = {};
                    const phylums = {};
                    this.data.heatmapData.rows.forEach(r => {
                        d.forEach(line => {
                            if (line.Species === r) {
                                data[r] = {...line};
                            }
                        });
                    });
                    d.forEach( s => {
                        if (!phylums[s.Phylum])
                            phylums[s.Phylum] = [s.Genus];
                        else if (!phylums[s.Phylum].includes(s.Genus))
                                phylums[s.Phylum].push(s.Genus);
                    });
                    // name Unknown to Other [phylum]
                    Object.keys(phylums).forEach( k => {
                        phylums[k] = phylums[k].sort();
                        if (phylums[k].indexOf("Unknown") > 0) {
                            phylums[k].splice(phylums[k].indexOf("Unknown"), 1);
                            phylums[k].push("Other " + k);
                        }
                    });
                    phylums["Other"] = ["Unclassified"];
                    this.data.phylums = phylums;
                    this.data.familyColorMap = initializeFamilyColors(phylums);
                    return data;
                },
            },
            rowTreeData: {
                type: "newick",
                optional: true,
                loaded(d) {
                    if (!d) return;
                    d.depth = 0;
                    const {rootNode, nodeList} = processTreeData(d);
                    // nodeList.forEach(node => {
                    //     if (this.data.heatmapData.rows.indexOf(node) < 0) {
                    //         console.log("Error!! tree data not mapped with heatmap data");
                    //     }
                    // });
                    this.data.heatmapData.rows = [...nodeList];
                    return rootNode;
                },
            },
            // colTreeData: {
            //     type: "newick",
            //     optional: true,
            //     loaded(d) {
            //         if (!d) return;
            //         d.depth = 0;
            //         const {rootNode, nodeList} = processTreeData(d);
            //         this.data.heatmapData.columns = [...nodeList];
            //         return rootNode;
            //     },
            // },
        },
        setup() {
            setUpRange(this);
            if (this.data.rowTreeData) setUpRowTree(this);
            if (this.data.colTreeData) setUpColTree(this);
            if (this.data.heatmapData.rows.length > 100) this.data.config.gridH = 10;
            else if (this.data.heatmapData.rows.length > 60) this.data.config.gridH = 12;
        }
    };
    return vizOpts; 
}

/*
* Control group species have negative correlation
* Gout group species have positive correlation
*/
// let nodeSeq = 0;
// let treeHeight = 0;

function initializeFamilyColors(phylums): any {
    const colorMap = {};
    let j = 200;
    const Color = Oviz.color.Color;
    Object.keys(phylums).forEach(k => {
        colorMap[k] = {};
        const initColor = Color.hsl(j, 75, 80);
        const hueInterval = 20;
        if (phylums[k].length <= 5) {
            phylums[k].forEach((genus, i) => {
                colorMap[k][genus] = initColor.darken(10 * (i % 5)).string;
            });
            j = j + Math.ceil(phylums[k].length / 5) * hueInterval;
        } else {
            phylums[k].forEach((genus, i) => {
                colorMap[k][genus] = initColor.shiftHue(Math.ceil(i / 5) * hueInterval)
                                            .darken(10 * (i % 5)).string;
            });
            j = j + Math.ceil(phylums[k].length / 5) * hueInterval;
        }
    });
    const unknown = {Unclassified: Color.rgb(200, 200, 200).string};
    colorMap["Other"] = unknown;
    return colorMap;
}

function setUpRowTree(v) {
    v.data.config.rowTree.depthUnit = v.data.config.rowTree.treeHeight / v.data.rowTreeData.height;
}

function setUpColTree(v) {
    v.data.config.colTree.depthUnit = v.data.config.rowTree.treeHeight / v.data.colTreeData.height;
}

function setUpRange(v) {
    v.data.config.rangeMin = v.data.heatmapData.range.min;
    v.data.config.rangeMax = v.data.heatmapData.range.max;
}

// export function findBound(x, power, sigDigit) {
//     if (x <= 0) {
//         console.log("Only accept positive values");
//         return;
//     }
//     if (x < Math.pow(10, sigDigit - 1))
//         return findBound(10 * x, power + 1, sigDigit);
//     else if (x > Math.pow(10, sigDigit))
//         return findBound(x / 10, power - 1, sigDigit);
//     else
//         return {bound: Math.ceil(x), power};
// }

export function findBound(x, power, sigDigit) {
    if (x <= 0) {
        console.log("Only accept positive values");
        return;
    }
    if (x < Math.pow(10, sigDigit - 1))
        return findBound(10 * x, power + 1, sigDigit);
    else if (x > Math.pow(10, sigDigit))
        return findBound(x / 10, power - 1, sigDigit);
    else
        return Math.ceil(x) / Math.pow(10, power);
}

export default SignedHeatmap;