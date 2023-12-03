import { Vec3, Color } from "../primitives.js"
import { Material } from "./material.js"
import { MaterialTypes, Utils } from "./utils.js"

export default class Dielectric extends Material{
    constructor(color, etaFrom=1, etaTo=1, roughnessX=0, roughnessY=0){
        super()
        this.type    = MaterialTypes.Dielectric
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo

        this.roughnessX = roughnessX
        this.roughnessY = roughnessY
    }

    static deserialize(mat){
        return new Dielectric(mat.color, mat.etaFrom, mat.etaTo, mat.roughnessX, mat.roughnessY)
    }

    hitLocal(dirIn){
        const isExiting = dirIn.z > 0
        const cosI     = Math.abs(dirIn.z)
        const etaFrom  = isExiting ? this.etaTo   : this.etaFrom
        const etaTo    = isExiting ? this.etaFrom : this.etaTo
        const etaRatio = etaFrom/etaTo

        let dirOut
        if(this.roughnessX == 0 && this.roughnessY == 0){

            const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)
            const reflectance = cosT===false ? false : this.fresnelReflectance(etaRatio, cosI, cosT)

            if(reflectance === false || reflectance > Math.random()){
                dirOut = Utils.reflect(dirIn)
            }else{
                dirOut = Vec3.set(dirIn, dirIn.x*etaRatio, dirIn.y*etaRatio, cosT*Math.sign(dirIn.z))
            }
            
        }else{
            const microNormal = Utils.TrowbridgeReitzMicrofacet(dirIn, this.roughnessX, this.roughnessY)
            const cosI_m = Math.abs(Vec3.dot(dirIn, microNormal))
            const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI_m)
            const reflectance = cosT===false ? false : this.fresnelReflectance(etaRatio, cosI_m, cosT)

            if(reflectance === false || reflectance > Math.random()){
                dirOut = Utils.reflectWithNormal(Vec3.clone(dirIn), microNormal)
                if(Utils.areSameHemisphere(dirIn, dirOut)){
                    return false
                }
            }else{
                const sign = Math.sign(Vec3.dot(dirIn, microNormal))
                const projected     = Vec3.add(Vec3.clone(dirIn), Vec3.mulScalar(Vec3.clone(microNormal), cosI_m*(-sign)))
                const perpendicular = Vec3.mulScalar(projected, etaRatio)
                const parallel      = Vec3.mulScalar(Vec3.clone(microNormal), cosT*sign)                             
                dirOut = Vec3.add(parallel, perpendicular)
                if(!Utils.areSameHemisphere(dirIn, dirOut)){
                    return false
                }
            }
        }
        
        return {
            color: this.sampleLocal(dirIn, dirOut, true),
            direction: dirOut
        }
    }

    sampleLocal(dirIn, dirOut, sampleFromHit=false){
        if(this.roughnessX == 0 && this.roughnessY == 0){
            return sampleFromHit ? Color.mulScalar(Color.clone(this.color), 1/Math.abs(dirOut.z)) : Color.ZERO
        }else{
            const etaFrom  = dirIn.z > 0 ? this.etaTo   : this.etaFrom
            const etaTo    = dirIn.z > 0 ? this.etaFrom : this.etaTo
            const etaRatio = etaFrom/etaTo

            const reversedIn = Vec3.mulScalar(Vec3.clone(dirIn), -1)
            const cosI = Math.abs(reversedIn.z)
            const masking = Utils.Masking(reversedIn, this.roughnessX, this.roughnessY)

            const isReflection = Utils.areSameHemisphere(reversedIn, dirOut)

            const MaskingShadowing = Utils.MaskingShadowing(reversedIn, dirOut, this.roughnessX, this.roughnessY)
            const microNormal = Vec3.normalize(Vec3.add(Vec3.mulScalar(Vec3.clone(dirOut), isReflection?1:1/etaRatio) , reversedIn))
            const cosI_m = Math.abs(Vec3.dot(reversedIn, microNormal))
            const D = Utils.TrowbridgeReitz(microNormal, this.roughnessX, this.roughnessY)

            const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI_m)
            // In case of total internal reflection, we consider the reflectance to be 1
            const reflectance = cosT===false ? 1 : this.fresnelReflectance(etaRatio, cosI_m, cosT)

            let f
            let PDF = 1
            if(isReflection){
                f = reflectance*D*MaskingShadowing/(4*reversedIn.z*dirOut.z)
                if(sampleFromHit){
                    PDF = reflectance*(D*(masking/cosI)*cosI_m) / (4*cosI_m)
                }
            }else{
                const tmp = Vec3.dot(dirOut, microNormal) + Vec3.dot(reversedIn, microNormal) * etaRatio 
                const factor = Vec3.dot(dirOut, microNormal) * Vec3.dot(reversedIn, microNormal) / (reversedIn.z * dirOut.z * (tmp*tmp))
                f = (1-reflectance)*D*MaskingShadowing*Math.abs(factor)
                if(sampleFromHit){
                    PDF = (1-reflectance)*(D*(masking/cosI)*cosI_m) * (Math.abs(Vec3.dot(dirOut, microNormal)) / (tmp*tmp)) 
                }
            }

            return Color.mulScalar(Color.clone(this.color), f/PDF)
        }
    }

    fresnelReflectance(eta, cosI, cosT){
        const rParallel      = (cosI-eta*cosT) / (cosI+eta*cosT)
        const rPerpendicular = (cosT-eta*cosI) / (cosT+eta*cosI)
        return (rParallel*rParallel + rPerpendicular*rPerpendicular)/2
    }
}