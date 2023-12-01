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

        this.roughnessX = 0//roughnessX
        this.roughnessY = 0//roughnessY
    }

    static deserialize(mat){
        return new Dielectric(mat.color, mat.etaFrom, mat.etaTo)
    }

    hitLocal(dirIn){
        const cosI     = Math.abs(dirIn.z)
        const etaFrom  = dirIn.z > 0 ? this.etaTo   : this.etaFrom
        const etaTo    = dirIn.z > 0 ? this.etaFrom : this.etaTo
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
            const cosI_m = Vec3.dot(dirIn, microNormal)
            const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI_m)
            const reflectance = cosT===false ? false : this.fresnelReflectance(etaRatio, cosI_m, cosT)

            if(reflectance === false || reflectance > Math.random()){
                dirOut = Utils.reflectWithNormal(dirIn, microNormal)
                if(Utils.areSameHemisphere(dirIn, dirOut)){
                    console.error("Not same hemisphere")
                }
            }else{
                const parallel      = Vec3.mulScalar(Vec3.clone(microNormal), -cosT)
                const projected     = Vec3.add(dirIn, Vec3.mulScalar(Vec3.clone(microNormal), cosI_m))
                const perpendicular = Vec3.mulScalar(projected, etaRatio)
                dirOut = Vec3.add(parallel, perpendicular)
                if(!Utils.areSameHemisphere(dirIn, dirOut)){
                    console.error("Not same hemisphere")
                }
            }
        }

        return {
            color: this.sampleLocal(dirIn, dirOut, true),
            direction: dirOut
        }
    }

    sampleLocal(dirIn, dirOut, fromHitLocal=false){
        if(this.roughnessX == 0 && this.roughnessY == 0){
            return fromHitLocal ? Color.mulScalar(Color.clone(this.color), 1/Math.abs(dirOut.z)) : Color.ZERO
        }else{
            

            const etaFrom  = dirIn.z > 0 ? this.etaTo   : this.etaFrom
            const etaTo    = dirIn.z > 0 ? this.etaFrom : this.etaTo
            const etaRatio = etaFrom/etaTo

            const reversedIn = Vec3.mulScalar(Vec3.clone(dirIn), -1)
            const microNormal = Vec3.normalize(Vec3.add(Vec3.mulScalar(Vec3.clone(dirOut), etaRatio) , reversedIn))
            // Should we check that the normal is facing in the right direction ?

            const cosI_m = Math.abs(Vec3.dot(reversedIn, microNormal))
            const D = Utils.TrowbridgeReitz(microNormal)

            if(fromHitLocal){

                // Note : In this section, the PDF and f should be both multiplied by the reflectance / transmittance, but as they are divided
                // afterward, we can spare this computation

                let f, PDF

                // Reflection
                if(Utils.areSameHemisphere(reversedIn, dirOut)){
                    PDF = (D*(Utils.Masking(reversedIn, this.roughnessX, this.roughnessY)/reversedIn.z)*cosI_m) / (4*cosI_m) 
                    f = D*Utils.MaskingShadowing(reversedIn, dirOut, this.roughnessX, this.roughnessY)/(4*reversedIn.z*Math.abs(dirOut.z)) 
                
                // Transmission
                }else{
                    const tmp = Vec3.dot(dirOut, microNormal) + Vec3.dot(reversedIn, microNormal) / etaRatio 
                    const denominator = Math.abs(Vec3.dot(dirOut, microNormal)) / (tmp*tmp)
                    PDF = (D*(Utils.Masking(reversedIn, this.roughnessX, this.roughnessY)/reversedIn.z)*cosI_m) / denominator 

                    const factor = Vec3.dot(dirOut, microNormal) * Vec3.dot(reversedIn, microNormal) / (reversedIn.z * dirOut.z * (tmp*tmp))
                    f = D*Utils.MaskingShadowing(reversedIn, dirOut, this.roughnessX, this.roughnessY)*Math.abs(factor)
                }
                return Color.mulScalar(Color.clone(this.color), f/PDF)
            }else{

                const cosI = Math.abs(dirIn.z)
                const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI)
                const reflectance = cosT===false ? false : this.fresnelReflectance(etaRatio, cosI, cosT)

                // Reflection
                if(Utils.areSameHemisphere(reversedIn, dirOut)){
                    f = reflectance* D*Utils.MaskingShadowing(reversedIn, dirOut, this.roughnessX, this.roughnessY)/(4*reversedIn.z*dirOut.z)
                
                // Transmission
                }else{
                    const tmp = Vec3.dot(dirOut, microNormal) + Vec3.dot(reversedIn, microNormal) / etaRatio
                    const factor = Vec3.dot(dirOut, microNormal) * Vec3.dot(reversedIn, microNormal) / (reversedIn.z * dirOut.z * (tmp*tmp))
                    f = (1-reflectance)*D*Utils.MaskingShadowing(reversedIn, dirOut, this.roughnessX, this.roughnessY)*Math.abs(factor)
                }
                return Color.mulScalar(Color.clone(this.color), f)
            }
        }
    }

    fresnelReflectance(eta, cosI, cosT){
        const rParallel      = (cosI-eta*cosT) / (cosI+eta*cosT)
        const rPerpendicular = (cosT-eta*cosI) / (cosT+eta*cosI)
        return (rParallel*rParallel + rPerpendicular*rPerpendicular)/2
    }
}