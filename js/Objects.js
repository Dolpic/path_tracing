import { Triangle } from "./shapes.js";

export default class Objects{
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

        const result = {vertices:[], colors:[], texture:null, faces:[], normals:[]}

        const lines = content.split("\n")
        for(const line of lines){
            const split = line.split(" ")
            switch(split[0]){
                case "v":
                    result.vertices.push([
                        parseFloat(split[1]), 
                        parseFloat(split[2]), 
                        parseFloat(split[3])
                    ])
                    result.colors.push([1,0.5,0.5,1])
                    break
                case "vn":
                    result.normals.push([
                        parseFloat(split[1]), 
                        parseFloat(split[2]), 
                        parseFloat(split[3])
                    ])
                    break
                case "f":
                    const p1 = Objects._faceInfo(split[1])
                    const p2 = Objects._faceInfo(split[2])
                    const p3 = Objects._faceInfo(split[3])
                    result.faces.push({vertices:[p1.v,p2.v,p3.v],  normals:[p1.n,p2.n,p3.n]})
                    break
            }
        }
        return result
    }

    static _faceInfo(f){
        return {v:f.split("/")[0]-1, n:f.split("/")[2]-1}
    }

    static wavefrontToTriangles(obj, material, transformMatrix){
        let result = []
        for(let i=0; i<obj.faces.length; i++){
            const v_index = obj.faces[i].vertices
            const n_index = obj.faces[i].normals
            const v = obj.vertices
            const n = obj.normals
            const p1 = Vec3.new(v[v_index[0]][0], v[v_index[0]][1], v[v_index[0]][2])
            const p2 = Vec3.new(v[v_index[1]][0], v[v_index[1]][1], v[v_index[1]][2])
            const p3 = Vec3.new(v[v_index[2]][0], v[v_index[2]][1], v[v_index[2]][2])
            const p1_n = Vec3.new(n[n_index[0]][0], n[n_index[0]][1], n[n_index[0]][2])
            const p2_n = Vec3.new(n[n_index[1]][0], n[n_index[1]][1], n[n_index[1]][2])
            const p3_n = Vec3.new(n[n_index[2]][0], n[n_index[2]][1], n[n_index[2]][2])
            const p1_t = transformMatrix.applyToPoint(p1)
            const p2_t = transformMatrix.applyToPoint(p2)
            const p3_t = transformMatrix.applyToPoint(p3)
            const p1_nt = transformMatrix.applyToNormal(p1_n)
            const p2_nt = transformMatrix.applyToNormal(p2_n)
            const p3_nt = transformMatrix.applyToNormal(p3_n)
            result.push(new Triangle(p1_t, p2_t, p3_t, material, p1_nt, p2_nt, p3_nt))
        }
        return result
    }

    static async loadObject(obj){
        const wavefront = await Objects.loadWavefront(obj.file)
        return Objects.wavefrontToTriangles(wavefront, obj.material, obj.transformMatrix)
    }

    static async loadObjects(objs){
        return Promise.all(objs.map(obj => Objects.loadObject(obj)))
    }
}