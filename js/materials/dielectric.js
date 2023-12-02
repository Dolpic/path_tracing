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

        this.roughnessX = 0.1//roughnessX
        this.roughnessY = 0.1//roughnessY
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
            if(microNormal.z < 0){
                console.error("Inverse micronormal")
                Vec3.mulScalar(microNormal, -1)
            }
            const cosI_m = Math.abs(Vec3.dot(dirIn, microNormal))
            if(Vec3.dot(dirIn, microNormal) > 0){
                console.error("dirIn from opposite side as normal")
            }
            const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI_m)
            const reflectance = cosT===false ? false : this.fresnelReflectance(etaRatio, cosI_m, cosT)

            if(reflectance === false /*|| reflectance > Math.random()*/){
                dirOut = Utils.reflectWithNormal(dirIn, microNormal)
                if(Utils.areSameHemisphere(dirIn, dirOut)){
                    return false
                }
            }else{
                const projected     = Vec3.add(Vec3.clone(dirIn), Vec3.mulScalar(Vec3.clone(microNormal), cosI_m*Math.sign(-Vec3.dot(dirIn, microNormal))))
                if(Math.abs(Vec3.dot(microNormal, projected)) > 0.00001){
                    console.error("Invalid projection")
                }
                const perpendicular = Vec3.mulScalar(projected, etaRatio)
                const parallel      = Vec3.mulScalar(Vec3.clone(microNormal), cosT*Math.sign(Vec3.dot(dirIn, microNormal)))
                dirOut = Vec3.add(parallel, perpendicular)
                // Should never happen
                if(Vec3.dot(microNormal, dirIn)*Vec3.dot(microNormal, dirOut) < 0){
                    console.error("Same hemisphere")
                    return false
                }
                // dirOut.z is always negative
                //console.log(dirOut)
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

            if(sampleFromHit){
                // Note : In this section, the PDF and f should be both multiplied by the reflectance / transmittance, but as they are divided
                // afterward, we can spare this computation

                const masking = Utils.Masking(reversedIn, this.roughnessX, this.roughnessY)

                let f, PDF
                // Reflection
                if(Utils.areSameHemisphere(reversedIn, dirOut)){

                    const MaskingShadowing = Utils.MaskingShadowing(reversedIn, dirOut, this.roughnessX, this.roughnessY)
                    const microNormal = Vec3.normalize(Vec3.add(Vec3.clone(dirOut) , reversedIn))
                    const cosI_m = Math.abs(Vec3.dot(reversedIn, microNormal))
                    const D = Utils.TrowbridgeReitz(microNormal, this.roughnessX, this.roughnessY)

                    PDF = (D*(masking/cosI)*cosI_m) / (4*cosI_m) 
                    f = D*MaskingShadowing/(4*reversedIn.z*dirOut.z) 
                    f*=0
                
                // Transmission
                }else{
                    let correctedDirOut = Vec3.clone(dirOut)
                    correctedDirOut.z *= -1

                    const MaskingShadowing = Utils.MaskingShadowing(reversedIn, correctedDirOut, this.roughnessX, this.roughnessY)
                    const microNormal = Vec3.normalize(Vec3.add(Vec3.mulScalar(Vec3.clone(correctedDirOut), etaRatio) , reversedIn))
                    const cosI_m = Math.abs(Vec3.dot(reversedIn, microNormal))
                    const D = Utils.TrowbridgeReitz(microNormal, this.roughnessX, this.roughnessY)

                    const tmp = Vec3.dot(correctedDirOut, microNormal) + Vec3.dot(reversedIn, microNormal) / etaRatio 
                    const denominator = Math.abs(Vec3.dot(correctedDirOut, microNormal)) / (tmp*tmp)
                    PDF = (D*(masking/cosI)*cosI_m) * denominator 

                    const factor = Vec3.dot(correctedDirOut, microNormal) * Vec3.dot(reversedIn, microNormal) / (reversedIn.z * dirOut.z * (tmp*tmp))
                    f = D*MaskingShadowing*Math.abs(factor)
                }
                return Color.mulScalar(Color.clone(this.color), f/PDF)
            }else{
                /*const cosT = Utils.cosTransmittedFromSnellLaw(etaRatio, cosI_m)
                const reflectance = cosT===false ? false : this.fresnelReflectance(etaRatio, cosI_m, cosT)

                let f
                // Reflection
                if(Utils.areSameHemisphere(reversedIn, dirOut)){
                    f = reflectance* D*MaskingShadowing/(4*reversedIn.z*dirOut.z)
                // Transmission
                }else{
                    const tmp = Vec3.dot(dirOut, microNormal) + Vec3.dot(reversedIn, microNormal) / etaRatio
                    const factor = Vec3.dot(dirOut, microNormal) * Vec3.dot(reversedIn, microNormal) / (reversedIn.z * dirOut.z * (tmp*tmp))
                    f = (1-reflectance)*D*MaskingShadowing*Math.abs(factor)
                }
                //console.log(f)
                return Color.mulScalar(Color.clone(this.color), f)*/
                return Color.ZERO
            }
        }
    }

    fresnelReflectance(eta, cosI, cosT){
        const rParallel      = (cosI-eta*cosT) / (cosI+eta*cosT)
        const rPerpendicular = (cosT-eta*cosI) / (cosT+eta*cosI)
        return (rParallel*rParallel + rPerpendicular*rPerpendicular)/2
    }
}