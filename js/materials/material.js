import { Vec3 } from "../primitives.js"

export const MaterialTypes = {
    Diffuse:     0,
    Reflector:   1,
    Transmitter: 2,
    Dielectric:  3,
    Conductor:   4
}

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

    static getGlobalXYAxis(normal){
        if(normal.x == 0 && normal.y == 0){
            return {x:Vec3.clone(Vec3.X), y:Vec3.clone(Vec3.Y)}
        }else{
            const xaxis = Vec3.normalize(Vec3.cross(Vec3.clone(Vec3.Y),normal))
            return {
                x: xaxis,
                y: Vec3.normalize(Vec3.cross(Vec3.clone(xaxis), normal))
            }
        }
    }
}

export class Utils{

    static cosTransmittedFromSnellLaw(etaRatio, cosIncident){
        const squared = 1 - etaRatio*etaRatio*(1-cosIncident*cosIncident)
        return squared < 0 ? false : Math.sqrt(squared)
    }

    static adjustIfExitingRay(cosI, etaFrom, etaTo, normal){
        if(cosI > 0){
            Vec3.mulScalar(normal, -1)
            return {
                etaRatio: etaTo/etaFrom,
                cosI:     cosI
            }
        }else{
            return {
                etaRatio: etaFrom/etaTo,
                cosI:     -cosI
            }
        }
    }

    /* Assumes local coordinates */
    static areSameHemisphere(vec1, vec2){
        return vec1.z * vec2.z > 0
    }

    static reflect(dir){
        dir.z *= -1
        return dir
    }

    static reflectWithNormal(dir, normal){
        return Vec3.sub(Vec3.clone(dir), Vec3.mulScalar(Vec3.clone(normal), 2*Vec3.dot(dir, normal)))
    }
}