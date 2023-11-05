import { Shapes } from "./Shape.js";

export default class Object{
    static async loadWavefront(file){
        const utf8Decoder = new TextDecoder("utf-8")
        const response = await fetch("ressources/models/"+file+".obj")
        const reader = response.body.getReader()
        let content = "";
        let {value:chunk, done:done} = await reader.read()
        while(!done){
            content += utf8Decoder.decode(chunk);
            ({value:chunk, done:done} = await reader.read())
        }

        let vertices = []
        let normals  = []
        let faces    = []

        const lines = content.split("\n")
        for(const line of lines){
            const split = line.split(" ")
            switch(split[0]){
                case "v":
                    vertices.push({
                        x:parseFloat(split[1]), 
                        y:parseFloat(split[2]), 
                        z:parseFloat(split[3])
                    })
                    break
                case "vn":
                    normals.push({
                        x:parseFloat(split[1]), 
                        y:parseFloat(split[2]), 
                        z:parseFloat(split[3])
                    })
                    break
                case "f":
                    const p1_i = Object._faceInfo(split[1])
                    const p2_i = Object._faceInfo(split[2])
                    const p3_i = Object._faceInfo(split[3])

                    faces.push({
                        vertices:[
                            vertices[p1_i.v],
                            vertices[p2_i.v],
                            vertices[p3_i.v]
                        ],  
                        normals:[
                            normals[p1_i.n],
                            normals[p2_i.n],
                            normals[p3_i.n]
                        ]
                    })
                    break
            }
        }
        return faces
    }

    static _faceInfo(f){
        return {v:f.split("/")[0]-1, n:f.split("/")[2]-1}
    }

    static wavefrontToTriangles(obj, material, transformMatrix){
        let result = []
        for(let i=0; i<obj.length; i++){
            const face = obj[i]
            const p1_t = transformMatrix.applyToPoint(face.vertices[0])
            const p2_t = transformMatrix.applyToPoint(face.vertices[1])
            const p3_t = transformMatrix.applyToPoint(face.vertices[2])
            const p1_nt = transformMatrix.applyToNormal(face.normals[0])
            const p2_nt = transformMatrix.applyToNormal(face.normals[1])
            const p3_nt = transformMatrix.applyToNormal(face.normals[2])
            result.push({
                type:Shapes.Triangle,
                p1:p1_t, p2:p2_t, p3:p3_t, 
                material:material, 
                p1_normal:p1_nt, p2_normal:p2_nt, p3_normal:p3_nt
            })
        }
        return result
    }

    static async loadObject(obj){
        const obj_data = await Objects.loadWavefront(obj.file)
        return Object.wavefrontToTriangles(obj_data, obj.material, obj.transformMatrix)
    }

    static async loadObjects(objs){
        return Promise.all(objs.map(obj => Objects.loadObject(obj)))
    }
}