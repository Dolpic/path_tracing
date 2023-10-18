class ModelHelper{
    static async loadWavefront(obj_file, mtl_file=""){
        const utf8Decoder = new TextDecoder("utf-8")
        const response = await fetch("ressources/models/"+obj_file)
        const reader = response.body.getReader()
        let content = ""
        let {value: chunk, done:done } = await reader.read()
        while(!done){
            content += utf8Decoder.decode(chunk);
            ({value: chunk, done:done } = await reader.read())
        }

        let result = {vertices:[], colors:[], texture:null, faces:[], normals:[]}
        let normals_list = []

        const splitted = content.split("\n")
        for(const line of splitted){
            let line_split = line.split(" ")
            switch(line_split[0]){
                case "v":
                    result.vertices.push([line_split[1], line_split[2], line_split[3]])
                    result.colors.push(1,0.5,0.5,1.0)
                    break
                case "vn":
                    normals_list.push([line_split[1], line_split[2], line_split[3]])
                    break
                case "f":
                    const f1 = ModelHelper.faceInfo(line_split[1])
                    const f2 = ModelHelper.faceInfo(line_split[2])
                    const f3 = ModelHelper.faceInfo(line_split[3])
                    result.faces.push([f1.vertex, f2.vertex, f3.vertex])
                    result.normals.push(...normals_list[f1.normal], ...normals_list[f2.normal], ...normals_list[f3.normal])
                    break
            }

        }            
        return result
    }

    static faceInfo(obj_face){
        return {
            vertex: obj_face.split("/")[0] - 1,
            normal: obj_face.split("/")[2] - 1
        }
    }

    static computeNormal(v1, v2, v3){
        const p1 = glMatrix.vec3.fromValues(v1[0], v1[1], v1[2])
        const p2 = glMatrix.vec3.fromValues(v2[0], v2[1], v2[2])
        const p3 = glMatrix.vec3.fromValues(v3[0], v3[1], v3[2])
    
        var u = glMatrix.vec3.create()
        glMatrix.vec3.sub(u, p1, p2)
    
        var v = glMatrix.vec3.create()
        glMatrix.vec3.sub(v, p1, p3)
    
        var res = glMatrix.vec3.create()
        glMatrix.vec3.cross(res, u, v)
        glMatrix.vec3.normalize(res, res)
        return res
    }
}