import Diffuse from "./materials/diffuse.js"
import Conductor from "./materials/conductor.js"
import { Vec3, Color } from "./primitives.js"
import { MaterialTypes } from "./materials/material.js"
import Reflector from "./materials/reflector.js"
import Transmitter from "./materials/transmitter.js"

export function deserialize(mat){
    switch(mat.type){
        case MaterialTypes.Diffuse:
            return Diffuse.deserialize(mat)
        case MaterialTypes.Reflector:
            return Reflector.deserialize(mat)
        case MaterialTypes.Transmitter:
            return Transmitter.deserialize(mat)
        case MaterialTypes.Dielectric:
            return new Dielectric(mat.color, mat.etaFrom, mat.etaTo)
        case MaterialTypes.Conductor:
            return Conductor.deserialize(mat)
        default:
            console.error(`Unknown material type : ${mat.type}`)
    }
}

export class Dielectric{
    constructor(color, etaFrom=1, etaTo=1){
        this.type    = MaterialTypes.Dielectric
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo
    }

    sample(ray, normal){
        let etaRatio
        let cosI = Vec3.dot(ray.getDirection(), normal);
        ({etaRatio, cosI} = Utils.adjustIfExitingRay(cosI, this.etaFrom, this.etaTo, normal))

        const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)
        
        let resultDir
        if(cosT === false){ // Total internal reflection
            resultDir = Utils.reflect(ray.getDirection(), normal)
        }else{
            const reflectance = this.fresnelReflectance(etaRatio, cosI, cosT)
            if(reflectance > Math.random()){
                resultDir = Utils.reflect(ray.getDirection(), normal)
            }else{ // Transmit
                const incidentPerpendicular = Vec3.add(ray.getDirection(), Vec3.mulScalar( Vec3.clone(normal), cosI))
                const perpendicular = Vec3.mulScalar(incidentPerpendicular, etaRatio)
                const parallel = Vec3.mulScalar(normal, -cosT)
                resultDir = Vec3.add(perpendicular, parallel)
            }
        }

        return {
            weight     : this.color,
            throughput : Color.ZERO,
            direction  : resultDir
        }
    }

    fresnelReflectance(eta, cosI, cosT){
        const rParallel      = (cosI-eta*cosT) / (cosI+eta*cosT)
        const rPerpendicular = (cosT-eta*cosI) / (cosT+eta*cosI)
        return (rParallel*rParallel + rPerpendicular*rPerpendicular)/2
    }
}

