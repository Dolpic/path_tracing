import { Vec3, Color } from "../primitives.js"
import { Material } from "./material.js"
import { MaterialTypes, Utils } from "./utils.js"

export default class Dielectric extends Material{
    constructor(color, etaFrom=1, etaTo=1){
        super()
        this.type    = MaterialTypes.Dielectric
        this.color   = color
        this.etaFrom = etaFrom
        this.etaTo   = etaTo

        this.roughnessX = 0//0.1//roughnessX
        this.roughnessY = 0//1//roughnessY
    }

    static deserialize(mat){
        return new Dielectric(mat.color, mat.etaFrom, mat.etaTo)
    }

    hitLocal(dirIn){
        const cosI     = Math.abs(dirIn.z)
        const etaFrom  = dirIn.z > 0 ? this.etaTo   : this.etaFrom
        const etaTo    = dirIn.z > 0 ? this.etaFrom : this.etaTo
        const etaRatio = etaFrom/etaTo

        if(this.roughnessX == 0 && this.roughnessY == 0){


            const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)
            let dirOut
            if(cosT === false){ // Total internal reflection
                dirOut = Utils.reflect(dirIn)
            }else{
                const reflectance = this.fresnelReflectance(etaRatio, cosI, cosT)
                if(reflectance > Math.random()){
                    dirOut = Utils.reflect(dirIn)
                }else{ // Transmit
                    dirOut = Vec3.set(dirIn, dirIn.x*etaRatio, dirIn.y*etaRatio, cosT*Math.sign(dirIn.z))
                }
            }

            return {
                color: Color.mulScalar(Color.clone(this.color), 1/Math.abs(dirOut.z)),
                direction: dirOut
            }
        }else{
            const microNormal = Utils.TrowbridgeReitzMicrofacet(dirIn, this.roughnessX, this.roughnessY)
            const cosI_m = Vec3.dot(dirIn, microNormal)
            const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI_m)
            let dirOut
            if(cosT === false){ // Total internal reflection
                dirOut = Utils.reflectWithNormal(dirIn, microNormal)
            }else{
                const reflectance = this.fresnelReflectance(etaRatio, cosI_m, cosT)
                if(reflectance > Math.random()){
                    dirOut = Utils.reflectWithNormal(dirIn, microNormal)
                }else{ // Transmit
                    const parallel      = Vec3.mulScalar(Vec3.clone(microNormal), -cosT)
                    const projected     = Vec3.add(dirIn, Vec3.mulScalar(Vec3.clone(microNormal), cosI_m))
                    const perpendicular = Vec3.mulScalar(projected, etaRatio)
                    dirOut = Vec3.add(parallel, perpendicular)
                }
            }

            if(Utils.areSameHemisphere(dirIn, dirOut)){
                console.error("Not same hemisphere")
            }

            return {
                color: this.sampleLocal(dirIn, dirOut, true),
                direction: dirOut
            }
        }
    }

    sampleLocal(dirIn, dirOut, fromHitLocal=false){
        if(this.roughnessX == 0 && this.roughnessY == 0){
            return fromHitLocal ? Color.mulScalar(Color.clone(this.color), 1/Math.abs(dirOut.z)) : Color.ZERO
        }else{
            const reversedIn = Vec3.mulScalar(Vec3.clone(dirIn), -1)
            const microNormal = Vec3.normalize(Vec3.add(Vec3.clone(reversedIn), dirOut))
            if(fromHitLocal){

            }else{

            }
            return Color.ZERO
        }
    }

    fresnelReflectance(eta, cosI, cosT){
        const rParallel      = (cosI-eta*cosT) / (cosI+eta*cosT)
        const rPerpendicular = (cosT-eta*cosI) / (cosT+eta*cosI)
        return (rParallel*rParallel + rPerpendicular*rPerpendicular)/2
    }
}