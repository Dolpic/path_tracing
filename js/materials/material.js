import { Vec3 } from "../primitives.js"

export class Material{
    constructor(){}

    static deserialize(mat){
        console.error("deserialize not implemented")
    }

    hit(dirIn, normal){
        const result = this.hitLocal(Material.toLocal(dirIn, normal))
        if(!result) return false
        return {
            color: result.color,
            direction: Material.toGlobal(result.direction, normal)
        }
    }

    sample(dirIn, dirOut, normal){
        Material.toLocal(dirIn, normal)
        Material.toLocal(dirOut, normal)
        return this.sampleLocal(dirIn, dirOut)
    }

    static toLocal(v, normal){
        const {x:xAxis, y:yAxis} = Material.getGlobalXYAxis(normal)
        const x = Vec3.dot(v, xAxis)
        const y = Vec3.dot(v, yAxis)
        const z = Vec3.dot(v, normal)
        return Vec3.normalize(Vec3.set(v, x,y,z))
    }

    static toGlobal(v, normal){
        const {x:xAxis, y:yAxis} = Material.getGlobalXYAxis(normal)
        const x = Vec3.mulScalar(xAxis, v.x)
        const y = Vec3.mulScalar(yAxis, v.y)
        const z = Vec3.mulScalar(Vec3.clone(normal), v.z)
        return Vec3.equal(v, Vec3.add(Vec3.add(x,y), z))
    }

    // TODO The fact that axis Y and Z are swapped is counterintuitive...
    static getGlobalXYAxis(normal){
        if(normal.x == 0 && normal.z == 0){
            return {x:Vec3.clone(Vec3.X), y:Vec3.clone(Vec3.Z)}
        }else{
            const xaxis = Vec3.normalize(Vec3.cross(Vec3.clone(Vec3.Y),normal))
            return {
                x: xaxis,
                y: Vec3.normalize(Vec3.cross(Vec3.clone(xaxis), normal))
            }
        }
    }
}